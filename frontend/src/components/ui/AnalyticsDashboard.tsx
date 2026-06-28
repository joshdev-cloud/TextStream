import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Area, Line, CartesianGrid } from "recharts";
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

const performanceData = [
  { session: "S1", score: 65, average: 65 },
  { session: "S2", score: 72, average: 68.5 },
  { session: "S3", score: 85, average: 74 },
  { session: "S4", score: 80, average: 75.5 },
  { session: "S5", score: 88, average: 78 },
  { session: "S6", score: 94, average: 80.6 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass px-3 py-2 rounded-xl border border-border/50 text-xs font-semibold shadow-xl">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name === "hours" ? `${entry.value} hrs` : entry.name === "average" ? `Avg: ${entry.value}%` : `Score: ${entry.value}%`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function AnalyticsDashboard({ isNewUser }: { isNewUser?: boolean }) {
  const [actualStudyData, setActualStudyData] = useState<any[]>([]);
  const [hasRealData, setHasRealData] = useState(false);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedStr = localStorage.getItem("textstream_daily_engagement");
        const stored = storedStr ? JSON.parse(storedStr) : {};
        const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const newStudyData = [];
        
        let foundData = false;
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const dayName = daysOfWeek[d.getDay()];
          const seconds = stored[dateStr] || 0;
          const hours = Math.round((seconds / 3600) * 10) / 10;
          if (hours > 0) foundData = true;
          newStudyData.push({ day: dayName, hours });
        }
        
        setActualStudyData(newStudyData);
        setHasRealData(foundData);
      } catch(e) {}
    }
  }, []);

  const finalStudyData = isNewUser ? [] : actualStudyData;
  const finalPerformanceData = isNewUser ? [] : performanceData;

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
          {(isNewUser || !hasRealData) && (
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

      {/* Performance Scores Chart */}
      <div className="glass rounded-3xl p-6 border border-border/40 relative overflow-hidden group flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-mint/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none transition group-hover:bg-mint/10" />
        
        <div className="flex items-start justify-between mb-4 z-10">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-mint/10 text-mint grid place-items-center">
              <TrendingUp className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Performance Over Time</h3>
              <p className="text-[10px] text-muted-foreground">Past scores and moving average</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-mint">80.6%</div>
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Overall Average</div>
          </div>
        </div>

        <div className="h-48 w-full relative z-10">
          {isNewUser && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-canvas/30 backdrop-blur-[2px] border border-dashed border-border/50 animate-fade-in">
              <p className="text-sm font-bold text-foreground">No sessions completed</p>
              <p className="text-[10px] text-muted-foreground mt-1">Start studying to generate your first score.</p>
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={finalPerformanceData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-mint)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-mint)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
              <XAxis 
                dataKey="session" 
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
              <Area 
                type="monotone" 
                dataKey="score" 
                name="score"
                stroke="none" 
                fillOpacity={1} 
                fill="url(#scoreGradient)" 
                animationDuration={1500}
              />
              <Line 
                type="monotone" 
                dataKey="average" 
                name="average"
                stroke="var(--color-amber-glow)" 
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
                animationDuration={1500}
              />
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
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
