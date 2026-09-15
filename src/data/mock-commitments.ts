import type { UpcomingCommitment } from "@/types/finance";

// Central mock upcoming commitments. Replace with GET /api/commitments
// when the backend exists.
export const mockCommitments: UpcomingCommitment[] = [
  {
    id: "commit-1",
    title: "Internet Bill",
    category: "Bills",
    dueDate: "2026-10-04",
    amount: 1500,
    icon: "Wifi",
    recurring: true,
  },
  {
    id: "commit-2",
    title: "Phone Bill",
    category: "Bills",
    dueDate: "2026-10-04",
    amount: 500,
    icon: "Smartphone",
    recurring: true,
  },
  {
    id: "commit-3",
    title: "Netflix & Spotify",
    category: "Subscriptions",
    dueDate: "2026-10-05",
    amount: 900,
    icon: "Repeat",
    recurring: true,
  },
  {
    id: "commit-4",
    title: "Emergency Fund Contribution",
    category: "Savings",
    dueDate: "2026-10-13",
    amount: 5000,
    icon: "ShieldCheck",
    recurring: true,
  },
  {
    id: "commit-5",
    title: "Laptop Fund Contribution",
    category: "Goal",
    dueDate: "2026-10-14",
    amount: 10000,
    icon: "Laptop",
    recurring: true,
  },
];
