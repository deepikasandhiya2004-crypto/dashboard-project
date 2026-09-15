import { useEffect, useState } from "react";

import {
  MoreHorizontal,
  Clock3,
  CheckCircle2,
  UserPlus,
  CalendarDays,
  DollarSign,
  Plus,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import StatCard from "../components/StatCard.jsx";
import ChartCard from "../components/ChartCard.jsx";
import { api } from "../lib/api.js";


/* =========================================================
   GRAPH DATA
========================================================= */

const sampleTrend = [
  { label: "May 1", value: 320 },
  { label: "May 3", value: 450 },
  { label: "May 5", value: 410 },
  { label: "May 8", value: 520 },
  { label: "May 11", value: 480 },
  { label: "May 15", value: 740 },
  { label: "May 18", value: 590 },
  { label: "May 20", value: 750 },
  { label: "May 22", value: 920 },
  { label: "May 25", value: 750 },
  { label: "May 27", value: 1000 },
  { label: "May 29", value: 1248 },
];


/* =========================================================
   DONUT DATA
========================================================= */

const projectData = [
  {
    name: "New",
    percentage: 35,
    value: 147,
  },
  {
    name: "Contacted",
    percentage: 25,
    value: 312,
  },
  {
    name: "Qualified",
    percentage: 20,
    value: 250,
  },
  {
    name: "Proposal",
    percentage: 25,
    value: 187,
  },
  {
    name: "Won",
    percentage: 5,
    value: 62,
  },
];

const projectColors = [
  "#7C3AED",
  "#00DC46",
  "#FF643F",
  "#5BA8EF",
  "#E00000",
];


/* =========================================================
   PROJECT PROGRESS
========================================================= */

const progressData = [
  {
    name: "Completed",
    value: 10,
    percentage: "28%",
  },
  {
    name: "In Progress",
    value: 18,
    percentage: "35%",
  },
  {
    name: "On Hold",
    value: 5,
    percentage: "14%",
  },
  {
    name: "Not Started",
    value: 18,
    percentage: "38%",
  },
];


/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.getTasks(),
      api.getProjects(),
    ])
      .then(([t, p]) => {
        setTasks(t);
        setProjects(p);
      })
      .catch((e) => {
        setError(e.message);
      });
  }, []);

  const doneCount = tasks.filter(
    (task) => task.status === "done"
  ).length;

  const openTasks = tasks.filter(
    (task) => task.status !== "done"
  ).length;


  return (
    <div
      style={{
        minHeight: "100%",
        background: "#F7F5E9",
        color: "#00373A",
        paddingBottom: "30px",
      }}
    >

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div
        style={{
          marginBottom: "18px",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "34px",
            lineHeight: "40px",
            color: "#202020",
            fontWeight: 800,
            letterSpacing: "-0.8px",
          }}
        >
          Dashboard
        </h1>

        <p
          style={{
            margin: "2px 0 0",
            fontSize: "15px",
            lineHeight: "20px",
            color: "rgba(0,55,58,0.40)",
          }}
        >
          Welcome back, Isha
        </p>
      </div>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div
          style={{
            marginBottom: "16px",
            padding: "10px 14px",
            borderRadius: "10px",
            background: "rgba(255,106,61,0.10)",
            fontSize: "13px",
            color: "#00373A",
          }}
        >
          Couldn't reach the API. Is the server running on
          port 4000?
        </div>
      )}


      {/* =====================================================
          STAT CARDS
      ===================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(5, minmax(0, 1fr))",
          gap: "14px",
          marginBottom: "16px",
        }}
      >

        <StatCard
          label="Total Leads"
          value="1,248"
          change="12.5%"
          type="users"
          color="#7C3AED"
        />

        <StatCard
          label="New Leads"
          value="437"
          change="14.8%"
          type="new"
          color="#00DC46"
        />

        <StatCard
          label="Contacted"
          value="312"
          change="8.3%"
          type="contacted"
          color="#FF643F"
        />

        <StatCard
          label="Qualified"
          value="250"
          change="16.7%"
          type="qualified"
          color="#7C3AED"
        />

        <StatCard
          label="Revenue This Month"
          value="$ 8,76,540"
          change="11.4%"
          type="revenue"
          color="#00C853"
        />

      </div>


      {/* =====================================================
          FIRST ROW
      ===================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 2fr) minmax(280px, 1.45fr) minmax(280px, 1.45fr)",
          gap: "10px",
          marginBottom: "10px",
        }}
      >

        {/* =================================================
            PROJECT ACTIVITY
        ================================================= */}

        <ChartCard
          title="Project Activity"
          data={sampleTrend}
          color="#7C3AED"
        />

{/* =================================================
    PROJECT OVERVIEW / DONUT
================================================= */}

<div
  style={{
    background: "#FAF9F0",
    border: "1px solid rgba(0,55,58,0.16)",
    borderRadius: "16px",
    padding: "16px",
    minHeight: "260px",
    boxSizing: "border-box",
  }}
>
  {/* HEADER */}

  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <h3
      style={{
        margin: 0,
        fontSize: "18px",
        lineHeight: "23px",
        color: "#202020",
        fontWeight: 800,
      }}
    >
      Project Overview
    </h3>

    <MoreHorizontal
      size={20}
      strokeWidth={2}
      color="rgba(0,55,58,0.45)"
    />
  </div>


  {/* DONUT + LEGEND */}

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "145px 1fr",
      alignItems: "center",
      columnGap: "10px",
      marginTop: "8px",
    }}
  >

    {/* DONUT */}

    <div
      style={{
        position: "relative",
        width: "145px",
        height: "175px",
      }}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <PieChart>

          <Pie
            data={projectData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={70}
            startAngle={90}
            endAngle={-270}
            paddingAngle={1}
            stroke="#FAF9F0"
            strokeWidth={1}
          >
            {projectData.map(
              (entry, index) => (
                <Cell
                  key={entry.name}
                  fill={projectColors[index]}
                />
              )
            )}
          </Pie>

          <Tooltip />

        </PieChart>
      </ResponsiveContainer>


      {/* CENTER */}

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            lineHeight: "17px",
            color: "#202020",
            fontWeight: 500,
          }}
        >
          1248
        </div>

        <div
          style={{
            marginTop: "2px",
            fontSize: "11px",
            lineHeight: "14px",
            color: "#202020",
            fontWeight: 400,
          }}
        >
          Total Project
        </div>
      </div>

    </div>


    {/* LEGEND */}

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "11px",
        paddingRight: "2px",
      }}
    >

      {projectData.map(
        (item, index) => (
          <div
            key={item.name}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >

            {/* DOT */}

            <span
              style={{
                width: "10px",
                height: "10px",
                minWidth: "10px",
                borderRadius: "50%",
                background:
                  projectColors[index],
                marginTop: "4px",
              }}
            />


            {/* NAME + PERCENTAGE */}

            <div
              style={{
                minWidth: 0,
              }}
            >

              <div
                style={{
                  fontSize: "13px",
                  lineHeight: "16px",
                  color: "#202020",
                  fontWeight: 500,
                }}
              >
                {item.name}
              </div>

              <div
                style={{
                  fontSize: "11px",
                  lineHeight: "15px",
                  color: "#202020",
                  fontWeight: 400,
                }}
              >
                {item.percentage}%
                {" "}
                ({item.value})
              </div>

            </div>

          </div>
        )
      )}

    </div>

  </div>
</div>
        {/* =================================================
            UPCOMING TASKS
        ================================================= */}

        <div
          style={{
            background: "#FAF9F0",
            border: "1px solid rgba(0,55,58,0.16)",
            borderRadius: "16px",
            padding: "16px",
            minHeight: "260px",
          }}
        >

          {/* TITLE */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >

            <h3
              style={{
                margin: 0,
                fontSize: "18px",
                lineHeight: "23px",
                color: "#202020",
                fontWeight: 800,
              }}
            >
              Upcoming Tasks
            </h3>

            <Clock3
              size={18}
              color="rgba(0,55,58,0.45)"
            />

          </div>


          {/* TASKS */}

          <div
            style={{
              marginTop: "17px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >

            <TaskItem
              title="Follow up with Isha"
              date="Today, 11:00 AM"
              status="High"
              color="#7C3AED"
            />

            <TaskItem
              title="Project Meeting"
              date="Today, 2:30 PM"
              status="Medium"
              color="#00C853"
            />

            <TaskItem
              title="Send Proposal Acme"
              date="Tomorrow, 10:00 AM"
              status="High"
              color="#7C3AED"
            />

            <TaskItem
              title="Review UI Design"
              date="Tomorrow, 12:00 PM"
              status="Low"
              color="#FF643F"
            />

          </div>


          {/* BUTTON */}

          <button
            style={{
              marginTop: "12px",
              border: "none",
              background: "transparent",
              color: "#7C3AED",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              padding: 0,
            }}
          >
            View All Tasks&nbsp; →
          </button>

        </div>

      </div>


      {/* =====================================================
          SECOND ROW
      ===================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 2fr) minmax(280px, 1.45fr) minmax(280px, 1.45fr)",
          gap: "10px",
        }}
      >

        {/* =================================================
            RECENT LEADS
        ================================================= */}

        <div
          style={{
            background: "#FAF9F0",
            border: "1px solid rgba(0,55,58,0.16)",
            borderRadius: "16px",
            padding: "16px",
            minHeight: "250px",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >

            <h3
              style={{
                margin: 0,
                fontSize: "18px",
                lineHeight: "23px",
                color: "#202020",
                fontWeight: 800,
              }}
            >
              Recent Leads
            </h3>

            <button
              style={{
                border: "none",
                background: "transparent",
                color: "#7C3AED",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              View All
            </button>

          </div>


          {/* TABLE */}

          <div
            style={{
              width: "100%",
              overflowX: "auto",
            }}
          >

            <table
              style={{
                width: "100%",
                minWidth: "560px",
                borderCollapse: "collapse",
              }}
            >

              <thead>

                <tr>

                  <th style={tableHeadStyle}>
                    LEAD NAME
                  </th>

                  <th style={tableHeadStyle}>
                    SOURCE
                  </th>

                  <th style={tableHeadStyle}>
                    STATUS
                  </th>

                  <th
                    style={{
                      ...tableHeadStyle,
                      textAlign: "right",
                    }}
                  >
                    VALUE
                  </th>

                </tr>

              </thead>


              <tbody>

                <LeadRow
                  name="Isha"
                  source="Media Ads"
                  status="Active"
                  value="$8,200"
                  color="#7C3AED"
                />

                <LeadRow
                  name="Iniya"
                  source="LinkedIn Ads"
                  status="Pending"
                  value="$8,200"
                  color="#FF643F"
                />

                <LeadRow
                  name="Sivagnanam"
                  source="Direct Outreach"
                  status="Qualified"
                  value="$45,000"
                  color="#00C853"
                />

                <LeadRow
                  name="Arun Kumar"
                  source="Referral"
                  status="Pending"
                  value="$12,400"
                  color="#FF643F"
                />

              </tbody>

            </table>

          </div>

        </div>


       {/* =================================================
    PROJECT OVERVIEW - FIGMA STYLE
================================================= */}

<div
  style={{
    background: "#FAF9F0",
    border: "1px solid rgba(0,55,58,0.20)",
    borderRadius: "16px",
    padding: "16px 18px",
    minHeight: "250px",
    boxSizing: "border-box",
  }}
>
  {/* TITLE */}

  <h3
    style={{
      margin: 0,
      fontSize: "18px",
      lineHeight: "23px",
      color: "#202020",
      fontWeight: 800,
    }}
  >
    Project Overview
  </h3>

  {/* CHART AREA */}

  <div
    style={{
      position: "relative",
      width: "100%",
      height: "180px",
      marginTop: "8px",
    }}
  >

    {/* TOP LABELS */}

    <div
      style={{
        position: "absolute",
        top: "0",
        left: "0",
        right: "0",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        textAlign: "center",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "12px",
            color: "#202020",
            fontWeight: 500,
          }}
        >
          Completed
        </div>

        <div
          style={{
            marginTop: "5px",
            fontSize: "11px",
            color: "#202020",
          }}
        >
          10(28%)
        </div>
      </div>

      <div>
        {/* EMPTY */}
      </div>

      <div>
        <div
          style={{
            fontSize: "12px",
            color: "#202020",
            fontWeight: 500,
          }}
        >
          Not Started
        </div>

        <div
          style={{
            marginTop: "5px",
            fontSize: "11px",
            color: "#202020",
          }}
        >
          18(38%)
        </div>
      </div>

      <div>
        {/* EMPTY */}
      </div>
    </div>


    {/* DOTTED BASE LINE */}

    <div
      style={{
        position: "absolute",
        left: "0",
        right: "0",
        top: "94px",
        borderTop:
          "2px dotted rgba(0,55,58,0.45)",
      }}
    />


    {/* VERTICAL BARS */}

    <div
      style={{
        position: "absolute",
        left: "0",
        right: "0",
        top: "38px",
        height: "105px",
        display: "grid",
        gridTemplateColumns:
          "repeat(4, 1fr)",
        alignItems: "center",
        textAlign: "center",
      }}
    >

      {/* COMPLETED */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "12px",
            height: "68px",
            background: "#7C3AED",
            borderRadius: "5px",
          }}
        />

        <div
          style={{
            width: "11px",
            height: "11px",
            marginTop: "6px",
            borderRadius: "50%",
            background: "#7C3AED",
          }}
        />
      </div>


      {/* IN PROGRESS */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "12px",
            height: "45px",
            background: "#00DC46",
            borderRadius: "5px",
          }}
        />

        <div
          style={{
            width: "11px",
            height: "11px",
            marginTop: "6px",
            borderRadius: "50%",
            background: "#00DC46",
          }}
        />
      </div>


      {/* ON HOLD */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "12px",
            height: "36px",
            background: "#FF643F",
            borderRadius: "5px",
          }}
        />

        <div
          style={{
            width: "11px",
            height: "11px",
            marginTop: "6px",
            borderRadius: "50%",
            background: "#FF643F",
          }}
        />
      </div>


      {/* NOT STARTED */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "12px",
            height: "60px",
            background: "#5BA8EF",
            borderRadius: "5px",
          }}
        />

        <div
          style={{
            width: "11px",
            height: "11px",
            marginTop: "6px",
            borderRadius: "50%",
            background: "#5BA8EF",
          }}
        />
      </div>

    </div>


    {/* BOTTOM LABELS */}

    <div
      style={{
        position: "absolute",
        left: "0",
        right: "0",
        bottom: "-2px",
        display: "grid",
        gridTemplateColumns:
          "repeat(4, 1fr)",
        textAlign: "center",
      }}
    >

      {/* IN PROGRESS */}

      <div
        style={{
          textAlign: "left",
          paddingLeft: "2px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: "#202020",
            fontWeight: 500,
          }}
        >
          In Progress
        </div>

        <div
          style={{
            marginTop: "5px",
            fontSize: "11px",
            color: "#202020",
          }}
        >
          18 (35%)
        </div>
      </div>


      {/* EMPTY */}

      <div></div>


      {/* ON HOLD */}

      <div
        style={{
          textAlign: "left",
          paddingLeft: "2px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: "#202020",
            fontWeight: 500,
          }}
        >
          On Hold
        </div>

        <div
          style={{
            marginTop: "5px",
            fontSize: "11px",
            color: "#202020",
          }}
        >
          5(14%)
        </div>
      </div>


      {/* EMPTY */}

      <div></div>

    </div>

  </div>
</div>
        {/* =================================================
            ACTIVITY FEED
        ================================================= */}

        <div
          style={{
            background: "#FAF9F0",
            border: "1px solid rgba(0,55,58,0.16)",
            borderRadius: "16px",
            padding: "16px",
            minHeight: "250px",
          }}
        >

          <h3
            style={{
              margin: 0,
              fontSize: "18px",
              lineHeight: "23px",
              color: "#202020",
              fontWeight: 800,
            }}
          >
            Activity Feed
          </h3>


          <div
            style={{
              marginTop: "17px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >

            <ActivityItem
              icon={
                <DollarSign
                  size={15}
                  strokeWidth={1.8}
                />
              }
              text="Isha moved to Qualified"
              time="2 min ago"
              color="#00C853"
            />

            <ActivityItem
              icon={
                <Plus
                  size={15}
                  strokeWidth={1.8}
                />
              }
              text="New lead Lisa Taylor added"
              time="15 min ago"
              color="#7C3AED"
            />

            <ActivityItem
              icon={
                <CalendarDays
                  size={15}
                  strokeWidth={1.8}
                />
              }
              text='Project "Website Redesign" updated'
              time="1 hour ago"
              color="#5BA8EF"
            />

          </div>


          <button
            style={{
              marginTop: "15px",
              border: "none",
              background: "transparent",
              color: "#7C3AED",
              fontSize: "12px",
              cursor: "pointer",
              padding: 0,
            }}
          >
            View All Tasks&nbsp; →
          </button>

        </div>

      </div>


      {/* =====================================================
          REAL DATABASE SUMMARY
      ===================================================== */}

      {(projects.length > 0 ||
        tasks.length > 0) && (
        <div
          style={{
            marginTop: "10px",
            background: "#FAF9F0",
            border:
              "1px solid rgba(0,55,58,0.16)",
            borderRadius: "16px",
            padding: "14px 16px",
          }}
        >

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "30px",
              fontSize: "12px",
              color:
                "rgba(0,55,58,0.55)",
            }}
          >

            <span>
              Real Projects:{" "}
              <strong
                style={{
                  color: "#202020",
                }}
              >
                {projects.length}
              </strong>
            </span>

            <span>
              Open Tasks:{" "}
              <strong
                style={{
                  color: "#202020",
                }}
              >
                {openTasks}
              </strong>
            </span>

            <span>
              Completed Tasks:{" "}
              <strong
                style={{
                  color: "#202020",
                }}
              >
                {doneCount}
              </strong>
            </span>

          </div>

        </div>
      )}

    </div>
  );
}


/* =========================================================
   TASK ITEM
========================================================= */

function TaskItem({
  title,
  date,
  status,
  color,
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "4px 18px minmax(0,1fr) auto",
        alignItems: "center",
        columnGap: "9px",
      }}
    >

      {/* COLOR LINE */}

      <span
        style={{
          width: "3px",
          height: "30px",
          borderRadius: "4px",
          background: color,
        }}
      />


      {/* CHECKBOX */}

      <span
        style={{
          width: "18px",
          height: "18px",
          borderRadius: "4px",
          border:
            "1px solid rgba(0,55,58,0.18)",
          boxSizing: "border-box",
        }}
      />


      {/* TEXT */}

      <div
        style={{
          minWidth: 0,
        }}
      >

        <div
          style={{
            fontSize: "12px",
            lineHeight: "16px",
            color: "#202020",
            fontWeight: 500,
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: "2px",
            fontSize: "10px",
            lineHeight: "13px",
            color:
              "rgba(0,55,58,0.36)",
          }}
        >
          {date}
        </div>

      </div>


      {/* STATUS */}

      <span
        style={{
          padding: "4px 10px",
          borderRadius: "6px",
          background: `${color}18`,
          color: color,
          fontSize: "10px",
          lineHeight: "12px",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {status}
      </span>

    </div>
  );
}


/* =========================================================
   LEAD ROW
========================================================= */

function LeadRow({
  name,
  source,
  status,
  value,
  color,
}) {
  return (
    <tr
      style={{
        borderBottom:
          "1px solid rgba(0,55,58,0.10)",
      }}
    >

      {/* NAME */}

      <td
        style={{
          padding: "8px 4px",
        }}
      >

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
          }}
        >

          <span
            style={{
              width: "25px",
              height: "25px",
              minWidth: "25px",
              borderRadius: "50%",
              background: color,
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontWeight: 500,
            }}
          >
            {name.charAt(0)}
          </span>

          <span
            style={{
              fontSize: "12px",
              color: "#202020",
              fontWeight: 500,
            }}
          >
            {name}
          </span>

        </div>

      </td>


      {/* SOURCE */}

      <td
        style={{
          padding: "8px 4px",
          fontSize: "11px",
          color:
            "rgba(0,55,58,0.42)",
        }}
      >
        {source}
      </td>


      {/* STATUS */}

      <td
        style={{
          padding: "8px 4px",
        }}
      >

        <span
          style={{
            display: "inline-block",
            padding: "4px 11px",
            borderRadius: "12px",
            background: `${color}20`,
            color: color,
            fontSize: "10px",
            lineHeight: "12px",
            fontWeight: 600,
          }}
        >
          {status}
        </span>

      </td>


      {/* VALUE */}

      <td
        style={{
          padding: "8px 4px",
          textAlign: "right",
          fontSize: "12px",
          color: "#202020",
          fontWeight: 500,
        }}
      >
        {value}
      </td>

    </tr>
  );
}


/* =========================================================
   ACTIVITY ITEM
========================================================= */

function ActivityItem({
  icon,
  text,
  time,
  color,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "11px",
      }}
    >

      {/* ICON */}

      <div
        style={{
          width: "25px",
          height: "25px",
          minWidth: "25px",
          borderRadius: "50%",
          border: `1px solid ${color}55`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: color,
          background: "#FAF9F0",
        }}
      >
        {icon}
      </div>


      {/* TEXT */}

      <div>

        <div
          style={{
            fontSize: "12px",
            lineHeight: "16px",
            color: "#202020",
            fontWeight: 500,
          }}
        >
          {text}
        </div>

        <div
          style={{
            marginTop: "2px",
            fontSize: "10px",
            lineHeight: "13px",
            color:
              "rgba(0,55,58,0.34)",
          }}
        >
          {time}
        </div>

      </div>

    </div>
  );
}


/* =========================================================
   TABLE HEADER STYLE
========================================================= */

const tableHeadStyle = {
  padding: "0 4px 8px",
  borderBottom:
    "1px solid rgba(0,55,58,0.14)",
  fontSize: "10px",
  lineHeight: "13px",
  color: "rgba(0,55,58,0.55)",
  fontWeight: 600,
  textAlign: "left",
};