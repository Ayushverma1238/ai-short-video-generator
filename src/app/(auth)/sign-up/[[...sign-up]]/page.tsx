import { SignUp } from '@clerk/nextjs'
import Image from 'next/image'

const SignUpPage = () => {
  return  (
    <div className="grid grid-cols-1 md:grid-cols-2">
      <div>
        <Image src="/login1.jpeg" alt="Sign Up" width={500} height={500} className='w-full min-h-screen object-cover' />
      </div>
      <div className='flex items-center justify-center min-h-screen py-10'>
        <SignUp/>
      </div>
    </div>
  )
}

export default SignUpPage