import Spline from '@splinetool/react-spline'

export default function HollowLightsLanding() {
  return (
    <div className="min-h-screen relative bg-black text-white">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/fvh1rcczCU4MCcKH/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/80 pointer-events-none" />
      <header className="relative z-10 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg tracking-widest uppercase text-gray-200">Hollow Lights</h1>
        <a href="/" className="text-sm text-gray-300 hover:text-white">Back</a>
      </header>
      <main className="relative z-10 px-6 md:px-12 lg:px-20 py-20 flex flex-col items-start gap-6">
        <h2 className="text-4xl md:text-6xl font-semibold leading-tight">Endless Twilight Village</h2>
        <p className="max-w-2xl text-gray-200/90">A 2D pixel-art horror adventure about memory, light, and the spaces between. Explore, solve, and try not to let the dark reshape you.</p>
        <div className="flex gap-3">
          <a href="/hollow-lights/index.html" className="bg-white text-black px-5 py-3 rounded-md font-medium shadow hover:bg-gray-100 transition">Play Web Prototype</a>
          <a href="#doc" className="border border-white/30 px-5 py-3 rounded-md font-medium hover:bg-white/10 transition">Design Doc</a>
        </div>
      </main>
      <section id="doc" className="relative z-10 bg-black/80 backdrop-blur px-6 md:px-12 lg:px-20 py-12">
        <p className="text-sm text-gray-300">Scroll below for the full design document in the chat response.</p>
      </section>
    </div>
  )
}
