'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';


export function ExamGuard({
  courseId,
  accessType,
}: {
  courseId: string;
  accessType: string;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // console.log("AccessType from ", accessType, courseId);
    if (status === 'loading') return;

    // Admin bypass (optional but recommended)
    if (session?.user?.role === 'ADMIN') return;

    // FREE exam → always allow
    if (accessType === 'FREE') return;

    // PAID exam → must be enrolled
    const isSubscribed = session?.user?.enrollments?.some(
      (e) => e.courseId === courseId
    );

    if (!isSubscribed) {
      router.push(`/checkout?courseId=${courseId}`);
    }
  }, [status, session, courseId, accessType, router]);

  return null;
}
