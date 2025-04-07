export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF]">
      <main className="flex-grow flex flex-col items-center pt-20 px-4">
        <h1 className="text-3xl text-black mb-8">About Us</h1>
        <div className="w-full max-w-4xl bg-white shadow-sm rounded-lg p-8 border border-zinc-200">
          <p className="text-gray-700">
            This is the about page. Tell your story here. Sed ut perspiciatis unde omnis iste natus
            error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa
            quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
          </p>
        </div>
      </main>
    </div>
  );
}
