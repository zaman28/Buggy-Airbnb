"use server";
import { db } from "@/lib/db";
import { LISTINGS_BATCH } from "@/utils/constants";
import { getCurrentUser } from "./user";

export const getListings = async (query?: {
  [key: string]: string | string[] | undefined | null;
}) => {
  try {
    const {
      userId,
      roomCount,
      guestCount,
      bathroomCount,
      country,
      startDate,
      endDate,
      category,
      cursor,
    } = query || {};

    let where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (category) {
      where.category = category;
    }

    if (roomCount) {
      where.roomCount = {
        gte: +roomCount,
      };
    }

    if (guestCount) {
      where.guestCount = {
        gte: +guestCount,
      };
    }

    if (bathroomCount) {
      where.bathroomCount = {
        gte: +bathroomCount,
      };
    }

    if (country) {
      where.country = country;
    }

    if (startDate && endDate) {
      where.NOT = {
        reservations: {
          some: {
            OR: [
              {
                AND: [
                  { startDate: { gte: startDate } },
                  { startDate: { lte: endDate } },
                ],
              },
              {
                AND: [
                  { endDate: { gte: startDate } },
                  { endDate: { lte: endDate } },
                ],
              },
            ],
          },
        },
      };
    }

    const filterQuery: any = {
      where,
      take: LISTINGS_BATCH,
      orderBy: { createdAt: "desc" },
    };

    if (cursor) {
      filterQuery.cursor = { id: cursor };
      // When filters are active, the cursor item might not match
      // the filter criteria, so skipping it could miss results
      if (Object.keys(where).length === 0) {
        filterQuery.skip = 1;
      }
    }

    const listings = await db.listing.findMany(filterQuery);

    const nextCursor =
      listings.length === LISTINGS_BATCH
        ? listings[LISTINGS_BATCH - 1].id
        : null;

    return {
      listings,
      nextCursor,
    };
  } catch (error) {
    return {
      listings: [],
      nextCursor: null,
    };
  }
};

export const getListingById = async (id: string) => {
  const listing = await db.listing.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
      reservations: {
        select: {
          startDate: true,
          endDate: true,
        },
      },
    },
  });

  return listing;
};

export const createListing = async (data: { [x: string]: any }) => {
  const {
    category,
    location: { region, label: country, latlng },
    guestCount,
    bathroomCount,
    roomCount,
    image: imageSrc,
    price,
    title,
    description,
  } = data;

  Object.keys(data).forEach((value: any) => {
    if (!data[value]) {
      throw new Error("Invalid data");
    }
  });

  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized!");

  const listing = await db.listing.create({
    data: {
      title,
      description,
      imageSrc,
      category,
      roomCount,
      bathroomCount,
      guestCount,
      country,
      region,
      latlng,
      price: parseInt(price, 10),
      userId: user.id,
    },
  });

  return listing;
};
