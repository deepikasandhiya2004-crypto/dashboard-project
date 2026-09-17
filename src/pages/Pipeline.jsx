import { GitBranch, Users, BriefcaseBusiness } from "lucide-react";

const leadStages = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
];

const dealStages = [
  "prospecting",
  "negotiation",
  "won",
  "lost",
];

function formatStage(stage) {
  return stage
    .replace("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Pipeline() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: "#EDE9FE" }}
        >
          <GitBranch size={22} className="text-dark" />
        </div>

        <div>
          <h1
            className="text-2xl text-dark"
            style={{ fontWeight: 800 }}
          >
            Pipeline
          </h1>

          <p className="mt-1 text-sm text-dark/60">
            Manage your lead and deal pipeline stages.
          </p>
        </div>
      </div>

      {/* Lead Pipeline */}
      <div className="mt-6 rounded-2xl border border-dark/10 bg-white p-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: "#E8F8ED" }}
          >
            <Users size={20} className="text-dark" />
          </div>

          <div>
            <h2
              className="text-lg text-dark"
              style={{ fontWeight: 700 }}
            >
              Lead Pipeline
            </h2>

            <p className="text-sm text-dark/50">
              Current lead stages
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {leadStages.map((stage, index) => (
            <div
              key={stage}
              className="rounded-xl border border-dark/10 p-4"
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-sm text-dark"
                  style={{ fontWeight: 600 }}
                >
                  {formatStage(stage)}
                </span>

                <span className="text-xs text-dark/40">
                  {index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deal Pipeline */}
      <div className="mt-6 rounded-2xl border border-dark/10 bg-white p-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: "#F3E8FF" }}
          >
            <BriefcaseBusiness size={20} className="text-dark" />
          </div>

          <div>
            <h2
              className="text-lg text-dark"
              style={{ fontWeight: 700 }}
            >
              Deal Pipeline
            </h2>

            <p className="text-sm text-dark/50">
              Current deal stages
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {dealStages.map((stage, index) => (
            <div
              key={stage}
              className="rounded-xl border border-dark/10 p-4"
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-sm text-dark"
                  style={{ fontWeight: 600 }}
                >
                  {formatStage(stage)}
                </span>

                <span className="text-xs text-dark/40">
                  {index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 rounded-2xl border border-dark/10 bg-white p-5">
        <p className="text-sm leading-6 text-dark/60">
          These pipeline stages are currently defined by the CRM
          Lead and Deal workflow. Leads use their status field, while
          Deals use their stage field.
        </p>
      </div>
    </div>
  );
}