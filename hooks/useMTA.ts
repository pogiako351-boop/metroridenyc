import { useState, useEffect, useRef } from 'react';

export interface TrainArrival {
  line: string;
  destination: string;
  minutesAway: number;
  occupancy: 'low' | 'medium' | 'high';
  isGhost: boolean;
  vehicleId: string;
  lastUpdate: number;
}

export interface TrainCar {
  carId: string;
  occupancy: 'quiet' | 'moderate' | 'busy';
  exitTip?: string;
}

// Mock MTA data for demo purposes (real GTFS-RT parsing requires protobuf)
const MOCK_TRAINS: TrainArrival[] = [
  { line: 'A', destination: 'Inwood - 207 St', minutesAway: 2, occupancy: 'low', isGhost: false, vehicleId: 'A001', lastUpdate: Date.now() },
  { line: 'C', destination: '168 St', minutesAway: 5, occupancy: 'medium', isGhost: false, vehicleId: 'C001', lastUpdate: Date.now() },
  { line: 'E', destination: 'Jamaica Center', minutesAway: 9, occupancy: 'high', isGhost: true, vehicleId: 'E001', lastUpdate: Date.now() - 200000 },
  { line: '1', destination: 'Van Cortlandt Park', minutesAway: 3, occupancy: 'low', isGhost: false, vehicleId: '1001', lastUpdate: Date.now() },
  { line: 'N', destination: 'Astoria', minutesAway: 7, occupancy: 'medium', isGhost: false, vehicleId: 'N001', lastUpdate: Date.now() },
];

const MOCK_CARS: TrainCar[] = [
  { carId: '8412', occupancy: 'quiet', exitTip: 'Board Car 1 for stairs at Times Sq' },
  { carId: '8413', occupancy: 'moderate' },
  { carId: '8414', occupancy: 'busy', exitTip: 'Board Car 4 for 42nd St Exit' },
  { carId: '8415', occupancy: 'quiet' },
  { carId: '8416', occupancy: 'moderate', exitTip: 'Best for Penn Station exit' },
  { carId: '8417', occupancy: 'busy' },
  { carId: '8418', occupancy: 'quiet', exitTip: 'Last car — least crowded' },
  { carId: '8419', occupancy: 'moderate' },
];

export function useMTATrains() {
  const [trains, setTrains] = useState<TrainArrival[]>(MOCK_TRAINS);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = () => {
    // Simulate countdown ticking
    setTrains((prev) =>
      prev.map((t) => ({
        ...t,
        minutesAway: Math.max(0, t.minutesAway - (Math.random() > 0.7 ? 1 : 0)),
        isGhost: Date.now() - t.lastUpdate > 180000,
      }))
    );
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 600);
    intervalRef.current = setInterval(refresh, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { trains, loading };
}

export function useTrainCars(line: string) {
  const [cars] = useState<TrainCar[]>(MOCK_CARS);
  const isGhost = line === 'E';
  return { cars, isGhost };
}
