import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const deals = await prisma.deal.findMany({
      where: {
        createdAt: {
          gt: sevenDaysAgo,
        },
        discountPct: {
          not: null,
        },
      },
      select: {
        title: true,
        source: true,
        discountPct: true,
        originalPrice: true,
        dealPrice: true,
        url: true,
      },
      orderBy: {
        discountPct: 'desc',
      },
      take: 3,
    });

    const serialized = deals.map((deal) => ({
      title: deal.title,
      source: deal.source,
      discountPct: deal.discountPct,
      originalPrice: deal.originalPrice ? parseFloat(deal.originalPrice.toString()) : null,
      dealPrice: deal.dealPrice ? parseFloat(deal.dealPrice.toString()) : null,
      url: deal.url,
    }));

    res.status(200).json(serialized);
  } catch (error) {
    console.error('Error fetching weekly top deals:', error);
    res.status(500).json({ error: 'Failed to fetch weekly top deals' });
  }
}
