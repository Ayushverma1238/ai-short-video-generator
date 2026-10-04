import { SignIn } from '@clerk/nextjs'
import Image from 'next/image'

const SignInPage = () => {
  return  (
    <div className="grid grid-cols-1 md:grid-cols-2">
      <div>
        <Image src="/login1.jpeg" alt="Sign In" height={500} width={500} className='w-full object-cover' />
      </div>
      <div className='flex items-center justify-center min-h-screen py-10'>
        <SignIn/>
      </div>
    </div>
    )  
}

export default SignInPage