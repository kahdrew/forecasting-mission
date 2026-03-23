import { User, IUser } from '@/models/User';
import { Forecast, IForecast, IForecastCategories, IPeriod } from '@/models/Forecast';
import { connectToDatabase } from './mongodb';
import mongoose from 'mongoose';

export interface RollupResult {
  userId: string;
  userName: string;
  role: string;
  categories: IForecastCategories;
  adjustedCategories: IForecastCategories;
  forecastCount: number;
  children?: RollupResult[];
}

export async function getDirectReports(managerId: string): Promise<IUser[]> {
  await connectToDatabase();
  return User.find({ managerId: new mongoose.Types.ObjectId(managerId) }).lean();
}

export async function getAllDescendants(userId: string): Promise<string[]> {
  const descendants: string[] = [];
  const queue: string[] = [userId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const directReports = await getDirectReports(currentId);

    for (const report of directReports) {
      descendants.push(report._id.toString());
      queue.push(report._id.toString());
    }
  }

  return descendants;
}

export function aggregateCategories(forecasts: IForecast[]): IForecastCategories {
  return forecasts.reduce(
    (acc, forecast) => ({
      commit: acc.commit + (forecast.categories.commit || 0),
      consumption: acc.consumption + (forecast.categories.consumption || 0),
      bestCase: acc.bestCase + (forecast.categories.bestCase || 0),
      services: acc.services + (forecast.categories.services || 0),
    }),
    { commit: 0, consumption: 0, bestCase: 0, services: 0 }
  );
}

export function aggregateAdjustedCategories(forecasts: IForecast[]): IForecastCategories {
  return forecasts.reduce(
    (acc, forecast) => {
      const latestAdjustment = forecast.adjustments.length > 0 
        ? forecast.adjustments[forecast.adjustments.length - 1].categories 
        : null;
      
      const finalCategories = latestAdjustment || forecast.categories;
      
      return {
        commit: acc.commit + (finalCategories.commit || 0),
        consumption: acc.consumption + (finalCategories.consumption || 0),
        bestCase: acc.bestCase + (finalCategories.bestCase || 0),
        services: acc.services + (finalCategories.services || 0),
      };
    },
    { commit: 0, consumption: 0, bestCase: 0, services: 0 }
  );
}

export async function calculateRollup(
  userId: string,
  period: IPeriod,
  includeChildren: boolean = true
): Promise<RollupResult> {
  await connectToDatabase();

  const user = await User.findById(userId).lean();
  if (!user) {
    throw new Error('User not found');
  }

  const forecasts = await Forecast.find({
    repId: new mongoose.Types.ObjectId(userId),
    'period.type': period.type,
    'period.year': period.year,
    'period.value': period.value,
  }).lean();

  const categories = aggregateCategories(forecasts as IForecast[]);
  const adjustedCategories = aggregateAdjustedCategories(forecasts as IForecast[]);

  const result: RollupResult = {
    userId: user._id.toString(),
    userName: user.name,
    role: user.role,
    categories,
    adjustedCategories,
    forecastCount: forecasts.length,
  };

  if (includeChildren && (user.role === 'manager' || user.role === 'director' || user.role === 'admin')) {
    const directReports = await getDirectReports(userId);
    const children: RollupResult[] = [];

    for (const report of directReports) {
      const childRollup = await calculateRollup(report._id.toString(), period, true);
      children.push(childRollup);

      result.categories.commit += childRollup.categories.commit;
      result.categories.consumption += childRollup.categories.consumption;
      result.categories.bestCase += childRollup.categories.bestCase;
      result.categories.services += childRollup.categories.services;

      result.adjustedCategories.commit += childRollup.adjustedCategories.commit;
      result.adjustedCategories.consumption += childRollup.adjustedCategories.consumption;
      result.adjustedCategories.bestCase += childRollup.adjustedCategories.bestCase;
      result.adjustedCategories.services += childRollup.adjustedCategories.services;

      result.forecastCount += childRollup.forecastCount;
    }

    if (children.length > 0) {
      result.children = children;
    }
  }

  return result;
}

export async function getTeamRollup(
  managerId: string,
  period: IPeriod
): Promise<{ team: RollupResult[]; totals: IForecastCategories }> {
  await connectToDatabase();

  const directReports = await getDirectReports(managerId);
  const team: RollupResult[] = [];
  const totals: IForecastCategories = { commit: 0, consumption: 0, bestCase: 0, services: 0 };

  for (const report of directReports) {
    const rollup = await calculateRollup(report._id.toString(), period, true);
    team.push(rollup);

    totals.commit += rollup.adjustedCategories.commit;
    totals.consumption += rollup.adjustedCategories.consumption;
    totals.bestCase += rollup.adjustedCategories.bestCase;
    totals.services += rollup.adjustedCategories.services;
  }

  return { team, totals };
}
