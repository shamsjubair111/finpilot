"use client";

import { useMemo } from "react";
import { GanttChartSquare } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { TimelineView } from "@/components/timeline/timeline-view";
import { EmptyState } from "@/components/shared/empty-state";
import { useFinance } from "@/components/providers/finance-provider";
import { buildTimeline } from "@/lib/derive";

export default function TimelinePage() {
  const { goals, purchases, commitments, user } = useFinance();
  const milestones = useMemo(
    () => buildTimeline(goals, purchases, commitments, user),
    [goals, purchases, commitments, user]
  );

  return (
    <div>
      <PageHeader
        title="Financial Timeline"
        subtitle="A forward look at your goals, planned purchases and upcoming commitments."
      />

      {milestones.length === 0 ? (
        <EmptyState
          icon={GanttChartSquare}
          title="No milestones yet"
          description="Add goals, wishlist items or upcoming bills and they'll be plotted here automatically."
        />
      ) : (
        <TimelineView milestones={milestones} />
      )}
    </div>
  );
}
