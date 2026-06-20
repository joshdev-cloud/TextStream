import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Activity, TrendingUp } from "lucide-react";

const studyData = [
  { day: "Mon", hours: 2.5 },
  { day: "Tue", hours: 3.0 },
  { day: "Wed", hours: 1.5 },
  { day: "Thu", hours: 4.0 },
  { day: "Fri", hours: 2.0 },
  { day: "Sat", hours: 5.5 },
  { day: "Sun", hours: 3.5 },
];

const examData = [
  { exam: "Quiz 1", score: 65 },
  { exam: "Quiz 2", score: 72 },
  { exam: "Midterm", score: 85 },
  { exam: "Quiz 3", score: 88 },
  { exam: "Mock Final", score: 94 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass px-3 py-2 rounded-xl border border-border/50 text-xs font-semibold shadow-xl">
        <p className="text-muted-foreground mb-1">{label}</p>
        <p className="text-foreground">
          {payload[0].value} {payload[0].name === "hours" ? "hrs" : "%"}
        </p>
      </div>
    );
  }
  return null;
};

export function AnalyticsDashboard({ isNewUser }: { isNewUser?: boolean }) {
  const finalStudyData = isNewUser ? [] : studyData;
  const finalExamData = isNewUser ? [] : examData;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 animate-slide-up">
      
      {/* Study Hours Chart */}
      <div className="glass rounded-3xl p-6 border border-border/40 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-glow/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none transition group-hover:bg-amber-glow/10" />
        
        <div className="flex items-center gap-2 mb-6">
          <div className="size-8 rounded-lg bg-amber-glow/10 text-amber-glow grid place-items-center">
            <Activity className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Study Hours (Past 7 Days)</h3>
            <p className="text-[10px] text-muted-foreground">Daily engagement tracked in hours</p>
          </div>
        </div>

        <div className="h-48 w-full relative">
          {isNewUser && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-canvas/30 backdrop-blur-[2px] border border-dashed border-border/50 animate-fade-in">
              <p className="text-sm font-bold text-foreground">No data yet</p>
              <p className="text-[10px] text-muted-foreground mt-1">Start your first study session to track progress.</p>
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={finalStudyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} 
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-secondary)", opacity: 0.4 }} />
              <Bar 
                dataKey="hours" 
                name="hours"
                fill="var(--color-amber-glow)" 
                radius={[4, 4, 0, 0]} 
                barSize={32}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Exam Scores Chart */}
      <div className="glass rounded-3xl p-6 border border-border/40 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-mint/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none transition group-hover:bg-mint/10" />
        
        <div className="flex items-center gap-2 mb-6">
          <div className="size-8 rounded-lg bg-mint/10 text-mint grid place-items-center">
            <TrendingUp className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Exam Performance Over Time</h3>
            <p className="text-[10px] text-muted-foreground">Scores from your latest study sessions</p>
          </div>
        </div>

        <div className="h-48 w-full relative">
          {isNewUser && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-canvas/30 backdrop-blur-[2px] border border-dashed border-border/50 animate-fade-in">
              <p className="text-sm font-bold text-foreground">No quizzes taken</p>
              <p className="text-[10px] text-muted-foreground mt-1">Try Exam Mode to generate your first score.</p>
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={finalExamData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
              <XAxis 
                dataKey="exam" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} 
                domain={[40, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="score" 
                name="score"
                stroke="var(--color-mint)" 
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--color-mint)", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "var(--color-mint)", strokeWidth: 2, stroke: "var(--color-canvas)" }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
