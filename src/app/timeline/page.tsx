import { PageHeader } from "@/components/shared/page-header";
import { TimelineView } from "@/components/timeline/timeline-view";
import { EmptyState } from "@/components/shared/empty-state";
import { GanttChartSquare } from "lucide-react";
import { mockTimeline } from "@/data/mock-timeline";

export default function TimelinePage() {
  return (
    <div>
      <PageHeader
        title="Financial Timeline"
        subtitle="A forward look at your upcoming purchases and milestones."
      />

      {mockTimeline.length === 0 ? (
        <EmptyState
          icon={GanttChartSquare}
          title="No milestones yet"
          description="Milestones from your goals and purchases will appear here."
        />
      ) : (
        <TimelineView milestones={mockTimeline} />
      )}
    </div>
  );
}
