import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";


export default function EditRequests(){
const qc = useQueryClient();
const { data } = useQuery(["edit-requests"], async()=>{
const res = await client.get("/admin/requests"); // We’ll add this route below
return res.data;
});


const review = useMutation(({id, status})=>client.patch(`/roi/edit-request/${id}`, { status }), {
onSuccess: ()=>qc.invalidateQueries(["edit-requests"])
});


return (
<div className="max-w-5xl mx-auto p-4">
<h1 className="text-xl font-semibold mb-4">Pending Edit Requests</h1>
<table className="w-full border">
<thead><tr className="bg-gray-100">
<th className="p-2 border">Date</th>
<th className="p-2 border">Field</th>
<th className="p-2 border">New Value</th>
<th className="p-2 border">Reason</th>
<th className="p-2 border">Actions</th>
</tr></thead>
<tbody>
{data?.map(r=> (
<tr key={r._id}>
<td className="border p-2">{new Date(r.createdAt).toLocaleString()}</td>
<td className="border p-2">{r.fieldPath}</td>
<td className="border p-2">{String(r.newValue)}</td>
<td className="border p-2">{r.reason}</td>
<td className="border p-2 flex gap-2">
<button onClick={()=>review.mutate({id:r._id,status:"APPROVED"})} className="px-3 py-1 bg-black text-white rounded">Approve</button>
<button onClick={()=>review.mutate({id:r._id,status:"REJECTED"})} className="px-3 py-1 border rounded">Reject</button>
</td>

</tr>
))} 
</tbody>
</table>
</div>
);
}