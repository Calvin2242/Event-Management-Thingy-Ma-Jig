import { GuestSeatPage } from '@/components/GuestSeatPage';

export default function GuestTicketRoute({ params }: { params: { token: string } }) {
  return <GuestSeatPage token={params.token} />;
}
