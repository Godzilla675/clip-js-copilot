import Link from "next/link";
import Image from "next/image";
import { featuresGridList } from "./utils/data";

export default function Home() {

  return (
    <div className="space-y-10">
      {/* <Header /> */}
      <div className="mx-auto bg-surfacePrimary max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center lg:pt-32">
        <p className="mx-auto -mt-4 max-w-2xl text-lg tracking-tight text-white-700 sm:mt-6">Welcome to
          <span className="border-b border-dotted border-slate-300"></span>
        </p>

        <h1 className="mx-auto max-w-6xl font-display text-4xl font-medium tracking-tight text-white-900 sm:text-6xl">
          <span className="inline-block mb-4">COPILOT AI POWERED VIDEO EDITING</span>
          <span className="block text-2xl sm:text-4xl text-white-600">POWERED BY GITHUB COPILOT</span>
        </h1>

        <p className="mx-auto mt-9 max-w-2xl text-lg tracking-tight text-white-700 sm:mt-6">
          <span className="inline-block">Edit your videos from your PC or phone no downloads, no registration, no watermarks.</span>
          <span className="inline-block">Online, Free and Open Source</span>
        </p>

        <div className="mt-12 flex flex-col justify-center gap-y-5 sm:mt-10 sm:flex-row sm:gap-y-0 sm:gap-x-6">
          <div className="relative flex flex-1 flex-col items-stretch sm:flex-none" data-headlessui-state="">
            <Link href="/projects" as={"/projects"}
              className="rounded-full bg-white border border-solid border-transparent transition-colors flex items-center justify-center text-gray-800 gap-2 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
              id="headlessui-menu-button-:r4:" aria-haspopup="true" aria-expanded="false" data-headlessui-state="" type="button">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="currentColor"
                className="h-6 w-6 flex-none"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v6H7v2h6v6h2v-6h6v-2h-6z" />
              </svg>
              <span className="ml-3">Get Started</span>
            </Link>
          </div>
          <Link href="https://github.com/mohyware/clip.js" target="_blank"
            className="rounded-full bg-black border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="currentColor"
              className="h-6 w-6 flex-none"
            >
              <path d="M12 0C5.372 0 0 5.372 0 12c0 5.303 3.438 9.8 8.207 11.385.6.111.793-.261.793-.577 0-.285-.011-1.04-.016-2.04-3.338.728-4.04-1.562-4.04-1.562-.545-1.38-1.33-1.748-1.33-1.748-1.087-.743.082-.73.082-.73 1.2.085 1.833 1.25 1.833 1.25 1.065 1.833 2.79 1.302 3.467.997.107-.773.417-1.302.758-1.603-2.664-.306-5.467-1.332-5.467-5.92 0-1.307.466-2.381 1.233-3.221-.123-.306-.534-.92.117-1.89 0 0 .765-.25 2.5.92a8.49 8.49 0 0 1 2.292-.306c.772 0 1.556.1 2.292.306 1.733-1.17 2.5-.92 2.5-.92.651.97.24 1.584.117 1.89.767.84 1.233 1.914 1.233 3.221 0 4.604-2.805 5.607-5.473 5.91.431.373.806 1.105.806 2.24 0 1.616-.016 2.93-.016 3.33 0 .315.192.69.8.577 4.771-1.585 8.207-6.082 8.207-11.385C24 5.372 18.628 0 12 0z" />
            </svg>
            <span className="ml-3">Star on GitHub</span>
          </Link>
        </div>
      </div>
      {/* Features Section */}
      <div className="space-y-10">
        <h2 className="mx-auto max-w-4xl text-center font-display text-5xl font-medium tracking-tight text-white-900 sm:text-4xl">
          <span className="inline-block">What Can it do?</span>
        </h2>

        <div className="grid w-full max-w-[1680px] mx-auto py-4 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {featuresGridList.items.map(({ id, title, description, icon }) => (
            <article
              key={id}
              className="flex flex-col gap-3 md:gap-4 rounded-lg border border-white border-opacity-10 shadow-md p-3 md:p-4 [box-shadow:_70px_-20px_130px_0px_rgba(255,255,255,0.05)_inset] dark:[box-shadow:_70px_-20px_130px_0px_rgba(255,255,255,0.05)_inset]"
            >
              <figure className="flex size-8 md:size-9 items-center justify-start rounded-full bg-surface-secondary p-2 dark:border-dark-border dark:bg-dark-surface-secondary">
                <Image
                  alt={icon.alt ?? title}
                  className="invert"
                  height={18}
                  src={icon.url}
                  width={18}
                />
              </figure>
              <div className="flex flex-col items-start gap-1">
                <h5 className="text-base md:text-lg font-medium">{title}</h5>
                <p className="text-pretty text-sm md:text-base text-text-secondary dark:text-dark-text-secondary">
                  {description}
                </p>
              </div>
            </article>
          ))}
        </div>
        <br />
        <br />
        <br />
      </div>

      {/* <Footer /> */}
    </div>
  );
}