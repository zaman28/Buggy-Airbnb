import React, { Suspense } from "react";

import EmptyState from "@/components/EmptyState";
import Heading from "@/components/Heading";
import ListingCard from "@/components/ListingCard";
import LoadMore from "@/components/LoadMore";

import { getCurrentUser } from "@/services/user";
import { getReservations } from "@/services/reservation";
import { getFavorites } from "@/services/favorite";

const ReservationPage = async ({
  searchParams,
}: {
  searchParams?: { userId?: string };
}) => {
  const user = await getCurrentUser();
  const favorites = await getFavorites();
  const userId = searchParams?.userId || user?.id;

  if (!userId) return <EmptyState title="Unauthorized" subtitle="Please login" />;

  const { listings, nextCursor } = await getReservations({
    userId,
  });

  if (listings.length === 0)
    return (
      <EmptyState
        title="No reservations found"
        subtitle="Looks like you have no reservations on your properties."
      />
    );

  return (
    <section className="main-container">
      <Heading title="Reservations" subtitle="Bookings on your properties" backBtn/>
      <div className=" mt-8 md:mt-10 grid  grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8">
        {listings.map((listing) => {
          const { reservation, ...data } = listing;
          const hasFavorited = favorites.includes(listing.id);
          return (
            <ListingCard
              key={listing.id}
              data={data}
              reservation={reservation}
              hasFavorited={hasFavorited}
            />
          );
        })}
        {nextCursor ? (
          <Suspense fallback={<></>}>
            <LoadMore
              nextCursor={nextCursor}
              fnArgs={{ authorId: userId }}
              queryFn={getReservations}
              queryKey={["reservations", userId]}
              favorites={favorites}
            />
          </Suspense>
        ) : null}
      </div>
    </section>
  );
};

export default ReservationPage;
