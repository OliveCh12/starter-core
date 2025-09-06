import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';

export default async function RootPage() {
  const user = await getUser();
  
  if (user) {
    redirect('/dashboard/home');
  } else {
    redirect('/sign-in');
  }
}