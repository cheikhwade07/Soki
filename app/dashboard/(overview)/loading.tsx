import { Loader2Icon } from 'lucide-react';
import DashboardSkeleton from "@/app/ui/skeletons";
export function Loading() {
    return (
        <div>
            {/* Render the component as a self-closing tag */}
            <Loader2Icon className="animate-spin"/>
            <DashboardSkeleton/>
        </div>
    )
}