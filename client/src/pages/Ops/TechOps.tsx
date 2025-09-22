import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function TechOps() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["ops-tech-today"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/ops/tech/today");
      return response.json();
    },
  });

  const checkIn = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/work-orders/${id}/check-in`, {});
      return response.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ops-tech-today"] }),
  });

  const checkOut = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/work-orders/${id}/check-out`, { notes: "" });
      return response.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ops-tech-today"] }),
  });

  if (isLoading) return <div>Loading…</div>;
  return (
    <div className="p-6 space-y-3">
      <div className="text-xl font-semibold">My Jobs Today: {data.date}</div>
      {data.jobs.map((j: any) => (
        <div
          key={j.id}
          className="border rounded p-3 flex items-center justify-between"
        >
          <div>
            <div className="font-medium">
              {j.serviceName || "FixiT Service"}
            </div>
            <div>{new Date(j.scheduledStartDate).toLocaleString()}</div>
            <div>Status: {j.status}</div>
          </div>
          <div className="flex gap-2">
            <button
              disabled={j.status !== "scheduled"}
              className="px-3 py-1 border rounded"
              onClick={() => checkIn.mutate(j.id)}
            >
              Check in
            </button>
            <button
              className="px-3 py-1 border rounded"
              onClick={() => checkOut.mutate(j.id)}
            >
              Check out
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
