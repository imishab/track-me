import { GalleryVerticalEnd } from "lucide-react"

import { LoginForm } from "@/src/components/login-form"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
           <Image src="/images/icons/192.png" alt="TrackMe" className="" width={24} height={24} />
          </div>
          TrackMe
        </a>
        <LoginForm />
      </div>
    </div>
  )
}
