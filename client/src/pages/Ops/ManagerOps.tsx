import { useQuery } from "@tanstack/react-query";

export default function ManagerOps() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["ops-manager-today"],
    queryFn: async () => {
      const r = await fetch("/api/ops/manager/today");
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
  });
  if (isLoading) return <div>Loading…</div>;
  if (error) return <div>Error.</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="text-xl font-semibold">Today: {data.date}</div>
      <div>
        Capacity: {data.capacity.used} / {data.capacity.max}
      </div>
      <div className="grid gap-2">
        {data.jobs.map((j: any) => (
          <div key={j.id} className="border rounded p-3">
            <div className="font-medium">
              {j.serviceName || "FixiT Service"}
            </div>
            <div>
              {new Date(j.scheduledStartDate).toLocaleString()} →{" "}
              {new Date(j.scheduledEndDate).toLocaleString()}
            </div>
            <div>Status: {j.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
