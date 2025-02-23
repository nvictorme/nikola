import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

export default function HomePage() {
  return (
    <main className="flex-1">
      <section className="bg-muted py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Elevate Your Events with Inflalo
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Discover a diverse selection of customizable inflatables and
                bouncy castles that will make your events unforgettable.
              </p>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <a
                  href="/products"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                >
                  View Our Products
                </a>
                <a
                  href="/contact"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                >
                  Get in Touch
                </a>
              </div>
            </div>
            <Carousel className="w-full max-w-md">
              <CarouselContent>
                <CarouselItem>
                  <img
                    src="https://dummyimage.com/448x252/cccccc/ffffff"
                    width="448"
                    height="252"
                    alt="Inflatable Product"
                    className="aspect-video object-cover rounded-md"
                  />
                </CarouselItem>
                <CarouselItem>
                  <img
                    src="https://dummyimage.com/448x252/cccccc/ffffff"
                    width="448"
                    height="252"
                    alt="Bouncy Castle"
                    className="aspect-video object-cover rounded-md"
                  />
                </CarouselItem>
                <CarouselItem>
                  <img
                    src="https://dummyimage.com/448x252/cccccc/ffffff"
                    width="448"
                    height="252"
                    alt="Customized Inflatable"
                    className="aspect-video object-cover rounded-md"
                  />
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      </section>
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                Featured Products
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Discover Our Unique Inflatables
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                From vibrant bouncy castles to eye-catching advertising
                inflatables, Inflalo has the perfect solution for your event.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
            <img
              src="https://dummyimage.com/550x310/cccccc/ffffff"
              width="550"
              height="310"
              alt="Inflatable Product"
              className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
            />
            <div className="flex flex-col justify-center space-y-4">
              <ul className="grid gap-6">
                <li>
                  <div className="grid gap-1">
                    <h3 className="text-xl font-bold">Exciting Inflatables</h3>
                    <p className="text-muted-foreground">
                      Add fun and excitement to your events with our colorful
                      inflatables.
                    </p>
                  </div>
                </li>
                <li>
                  <div className="grid gap-1">
                    <h3 className="text-xl font-bold">
                      InflaPlay Bouncy Castles
                    </h3>
                    <p className="text-muted-foreground">
                      Provide endless entertainment with our high-quality bouncy
                      castles.
                    </p>
                  </div>
                </li>
                <li>
                  <div className="grid gap-1">
                    <h3 className="text-xl font-bold">
                      Promotional Inflatables
                    </h3>
                    <p className="text-muted-foreground">
                      Capture attention and promote your brand with our
                      customizable inflatables.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                Highlighted Products
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Explore Our Featured Inflatables
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Check out our most popular inflatables that are sure to impress.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <a href="#" className="relative group overflow-hidden rounded-lg">
              <img
                src="https://dummyimage.com/400x300/cccccc/ffffff"
                width="400"
                height="300"
                alt="Fun Inflatable"
                className="w-full aspect-[4/3] object-cover group-hover:opacity-50 transition-opacity"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-6 text-white group-hover:opacity-100 transition-opacity">
                <h3 className="text-xl font-bold">Fun Inflatables</h3>
                <p className="text-sm">
                  Bring joy and excitement to your events.
                </p>
              </div>
            </a>
            <a href="#" className="relative group overflow-hidden rounded-lg">
              <img
                src="https://dummyimage.com/400x300/cccccc/ffffff"
                width="400"
                height="300"
                alt="InflaPlay Bouncy Castle"
                className="w-full aspect-[4/3] object-cover group-hover:opacity-50 transition-opacity"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-6 text-white group-hover:opacity-100 transition-opacity">
                <h3 className="text-xl font-bold">InflaPlay Bouncy Castles</h3>
                <p className="text-sm">
                  Offer endless hours of fun and entertainment.
                </p>
              </div>
            </a>
            <a href="#" className="relative group overflow-hidden rounded-lg">
              <img
                src="https://dummyimage.com/400x300/cccccc/ffffff"
                width="400"
                height="300"
                alt="Advertising Inflatables"
                className="w-full aspect-[4/3] object-cover group-hover:opacity-50 transition-opacity"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-6 text-white group-hover:opacity-100 transition-opacity">
                <h3 className="text-xl font-bold">Advertising Inflatables</h3>
                <p className="text-sm">
                  Grab attention and promote your brand.
                </p>
              </div>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
