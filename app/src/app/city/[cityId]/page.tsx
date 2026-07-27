import { CityExperience } from '@/components/game-ui/CityExperience';

export default async function CityPage({ params }: { params: Promise<{ cityId: string }> }) {
  const { cityId } = await params;
  return <CityExperience cityId={cityId} />;
}
