import { useRouter } from 'expo-router';
import { VehicleForm } from '../../src/components/VehicleForm';
import { createVehicle, NewVehicleInput } from '../../src/db/vehicles';

export default function NewVehicleScreen() {
  const router = useRouter();

  async function handleSubmit(input: NewVehicleInput) {
    const vehicle = await createVehicle(input);
    router.replace(`/vehicle/${vehicle.id}`);
  }

  return <VehicleForm submitLabel="Salvar veículo" onSubmit={handleSubmit} />;
}
