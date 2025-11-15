import { GAME_CONFIG } from './config.js';

class BootScene extends Phaser.Scene {
  constructor(){ super('Boot'); }
  preload(){
    this.load.setPath('./assets');
    // Minimal placeholder assets generated via code
    // Player: 8x8 white square; Light mask will be dynamic
  }
  create(){ this.scene.start('Preload'); }
}

class PreloadScene extends Phaser.Scene {
  constructor(){ super('Preload'); }
  preload(){
    this.load.setPath('./assets');
    // Generate simple textures
    const g = this.make.graphics({x:0,y:0, add:false});
    // Player
    g.fillStyle(0xffffff, 1); g.fillRect(0,0,8,8); g.generateTexture('player',8,8); g.clear();
    // Wall tile
    g.fillStyle(0x1f2937, 1); g.fillRect(0,0,16,16); g.lineStyle(1,0x111827,1); g.strokeRect(0.5,0.5,15,15); g.generateTexture('wall',16,16); g.clear();
    // Floor tile
    g.fillStyle(0x0f172a,1); g.fillRect(0,0,16,16); g.generateTexture('floor',16,16); g.clear();
    // Fuel icon
    g.fillStyle(0xf59e0b,1); g.fillRect(0,0,6,10); g.generateTexture('fuel',6,10); g.clear();
  }
  create(){ this.scene.start('Menu'); }
}

class MenuScene extends Phaser.Scene {
  constructor(){ super('Menu'); }
  create(){
    const { width, height } = this.scale;
    this.add.text(width/2, height/2 - 40, 'Hollow Lights', { fontFamily:'monospace', fontSize: '28px', color:'#e5e7eb'}).setOrigin(0.5);
    this.add.text(width/2, height/2, 'Press SPACE to Begin', { fontFamily:'monospace', fontSize:'16px', color:'#94a3b8'}).setOrigin(0.5);
    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('Game'));
  }
}

class UIOverlay extends Phaser.Scene {
  constructor(){ super({ key: 'UIOverlay', active: false }); }
  init(data){ this.gameScene = data.gameScene; }
  create(){
    this.fuelText = this.add.text(12, 10, 'Fuel: 100', { fontFamily:'monospace', fontSize:'14px', color:'#f59e0b' }).setScrollFactor(0);
    this.sanityText = this.add.text(12, 28, 'Sanity: 100', { fontFamily:'monospace', fontSize:'14px', color:'#60a5fa' }).setScrollFactor(0);
  }
  update(){
    if(!this.gameScene) return;
    this.fuelText.setText('Fuel: ' + this.gameScene.light.fuel.toFixed(0));
    this.sanityText.setText('Sanity: ' + this.gameScene.sanity.toFixed(0));
  }
}

class GameScene extends Phaser.Scene {
  constructor(){ super('Game'); }
  create(){
    // Simple tilemap room with walls
    const cols = 60, rows = 40, tile = 16;
    this.cameras.main.setZoom(2);
    this.physics.world.setBounds(0,0, cols*tile, rows*tile);

    // Floor
    for(let y=0; y<rows; y++){
      for(let x=0; x<cols; x++){
        this.add.image(x*tile+tile/2, y*tile+tile/2, 'floor').setOrigin(0.5);
      }
    }
    // Walls
    this.walls = this.physics.add.staticGroup();
    for(let x=0; x<cols; x++){
      this.walls.create(x*tile+tile/2, tile/2, 'wall');
      this.walls.create(x*tile+tile/2, rows*tile - tile/2, 'wall');
    }
    for(let y=1; y<rows-1; y++){
      this.walls.create(tile/2, y*tile+tile/2, 'wall');
      this.walls.create(cols*tile - tile/2, y*tile+tile/2, 'wall');
    }
    // A little maze chunk
    for(let x=10; x<30; x+=2){ this.walls.create(x*tile+tile/2, 15*tile+tile/2, 'wall'); }

    // Player
    this.player = this.physics.add.sprite(100,100,'player');
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.walls);

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SHIFT,SPACE');

    // Light system (basic): fuel, stability, focus
    this.light = { fuel: 100, stability: 100, focus: 1 };
    this.lightCircle = this.make.graphics({ x:0, y:0, add:false });
    this.darkness = this.add.renderTexture(0,0, cols*tile, rows*tile).setDepth(1000);

    this.updateLightMask();

    // Sanity system
    this.sanity = 100;

    // Example fuel pickups
    this.fuels = this.physics.add.group();
    for(let i=0; i<10; i++){
      const fx = Phaser.Math.Between(100, cols*tile-100);
      const fy = Phaser.Math.Between(100, rows*tile-100);
      const f = this.fuels.create(fx, fy, 'fuel');
      f.setScale(1.5);
    }
    this.physics.add.overlap(this.player, this.fuels, (_, fuel) => {
      this.light.fuel = Math.min(100, this.light.fuel + 20);
      fuel.destroy();
    });

    // UI Overlay
    this.scene.launch('UIOverlay', { gameScene: this });
  }

  update(time, delta){
    const dt = delta/1000;

    // Movement
    const speed = this.keys.SHIFT.isDown ? 160 : 110;
    let vx = 0, vy = 0;
    if(this.cursors.left.isDown || this.keys.A.isDown) vx -= 1;
    if(this.cursors.right.isDown || this.keys.D.isDown) vx += 1;
    if(this.cursors.up.isDown || this.keys.W.isDown) vy -= 1;
    if(this.cursors.down.isDown || this.keys.S.isDown) vy += 1;
    const len = Math.hypot(vx, vy) || 1;
    this.player.setVelocity((vx/len)*speed, (vy/len)*speed);

    // Light fuel consumption
    const baseDrain = 2; // per second
    const focusFactor = this.light.focus; // 1..2
    this.light.fuel = Math.max(0, this.light.fuel - baseDrain*focusFactor*dt);

    // Adjust focus with SPACE (narrower/stronger vs wider/weaker)
    if(Phaser.Input.Keyboard.JustDown(this.keys.SPACE)){
      this.light.focus = this.light.focus === 1 ? 1.6 : 1; // toggle
    }

    // Sanity affected by darkness (if fuel low, radius small)
    const radius = this.getLightRadius();
    const inDarkness = radius < 90; // arbitrary threshold
    const sanityDrain = inDarkness ? (0.5 + (90 - radius)/180) : -0.2; // recover slowly in good light
    this.sanity = Phaser.Math.Clamp(this.sanity - sanityDrain*dt, 0, 100);

    // Visual distortions suggestion: camera shake when low sanity
    if(this.sanity < 30 && Math.random() < 0.003){ this.cameras.main.shake(120, 0.002); }

    // Update darkness mask
    this.updateLightMask();
  }

  getLightRadius(){
    const minR = 60, maxR = 170;
    const fuelRatio = this.light.fuel/100; // 0..1
    const focusMul = this.light.focus === 1.6 ? 0.8 : 1; // tighter focus = smaller radius but stronger clarity later
    return Phaser.Math.Linear(minR, maxR, fuelRatio) * focusMul;
  }

  updateLightMask(){
    const r = this.getLightRadius();
    const cx = this.player.x, cy = this.player.y;

    // Darkness pass
    this.darkness.clear();
    this.darkness.fill(11, 13, 18, 255); // #0b0d12
    // Cut a radial gradient hole as the light
    const g = this.lightCircle;
    g.clear();
    const steps = 3;
    for(let i=steps; i>0; i--){
      const ir = r + i*12;
      g.fillStyle(0xffffff, 0.12 * (steps - i + 1));
      g.fillCircle(cx, cy, ir);
    }
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx, cy, r);
    this.darkness.draw(g, 0, 0, 1, Phaser.BlendModes.ERASE);
  }
}

class EndingScene extends Phaser.Scene {
  constructor(){ super('Ending'); }
  create(){
    const { width, height } = this.scale;
    this.add.text(width/2, height/2 - 20, 'Thanks for trying the prototype', { fontFamily:'monospace', fontSize:'16px', color:'#cbd5e1'}).setOrigin(0.5);
    this.add.text(width/2, height/2 + 10, 'Reload to play again', { fontFamily:'monospace', fontSize:'12px', color:'#94a3b8'}).setOrigin(0.5);
  }
}

const game = new Phaser.Game({
  ...GAME_CONFIG,
  scene: [BootScene, PreloadScene, MenuScene, GameScene, UIOverlay, EndingScene]
});
