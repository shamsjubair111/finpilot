import type { TimelineMilestone } from "@/types/finance";

// Central mock financial timeline. Replace with GET /api/timeline when the
// backend exists.
export const mockTimeline: TimelineMilestone[] = [
  {
    id: "tl-1",
    date: "2026-09-30",
    title: "RAM Purchased",
    description: "16GB RAM upgrade completed for the dev machine.",
    type: "purchase",
    icon: "MemoryStick",
    amount: 5500,
  },
  {
    id: "tl-2",
    date: "2026-09-30",
    title: "Emergency Fund Contribution",
    description: "Monthly contribution keeps the fund on track.",
    type: "contribution",
    icon: "ShieldCheck",
    amount: 5000,
  },
  {
    id: "tl-3",
    date: "2026-10-20",
    title: "SSD Purchase",
    description: "512GB SSD arrives for storage expansion.",
    type: "purchase",
    icon: "HardDrive",
    amount: 5000,
  },
  {
    id: "tl-4",
    date: "2026-12-15",
    title: "Emergency Fund Reaches ৳120K",
    description: "Fund crosses two-thirds of its ৳180K target.",
    type: "emergency_fund",
    icon: "ShieldCheck",
    amount: 120000,
  },
  {
    id: "tl-5",
    date: "2027-02-10",
    title: "Laptop Fund Reaches Target",
    description: "Enough saved to purchase the new development laptop.",
    type: "goal",
    icon: "Laptop",
    amount: 75000,
  },
  {
    id: "tl-6",
    date: "2027-06-05",
    title: "Travel Fund Milestone",
    description: "Halfway to the Southeast Asia trip budget.",
    type: "goal",
    icon: "Plane",
    amount: 40000,
  },
  {
    id: "tl-7",
    date: "2027-12-01",
    title: "Education Fund Target",
    description: "Master's education fund reaches its full ৳300K goal.",
    type: "goal",
    icon: "GraduationCap",
    amount: 300000,
  },
];
