import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Phone, Car, TrendingUp, IndianRupee, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { apiClient } from "@/lib/api-client";

const weeklyData = [
  { day: "Mon", views: 320, enquiries: 12 },
  { day: "Tue", views: 450, enquiries: 18 },
  { day: "Wed", views: 380, enquiries: 14 },
  { day: "Thu", views: 520, enquiries: 22 },
  { day: "Fri", views: 610, enquiries: 28 },
  { day: "Sat", views: 890, enquiries: 35 },
  { day: "Sun", views: 760, enquiries: 30 },
];

const sourceData = [
  { name: "WhatsApp", value: 45, color: "hsl(142 76% 36%)" },
  { name: "Phone Call", value: 30, color: "hsl(217 73% 21%)" },
  { name: "Website", value: 25, color: "hsl(25 100% 50%)" },
];

const recentActivity = [
  { type: "enquiry", text: "New enquiry for Hyundai Creta SX from Rahul S.", time: "2 min ago" },
  { type: "view", text: "Honda City ZX crossed 500 views", time: "1 hour ago" },
  { type: "listing", text: "Mahindra Thar LX listing updated", time: "3 hours ago" },
  { type: "enquiry", text: "WhatsApp message from Priya M. for Swift VXI", time: "5 hours ago" },
  { type: "boost", text: "Boost expired for Tata Nexon XZ+", time: "Yesterday" },
];

export function DashboardOverview({ dealerId }: { dealerId: string }) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [vData, lData] = await Promise.all([
          apiClient.get(`/api/vehicles/dealer/${dealerId}`),
          apiClient.get(`/api/leads/dealer/${dealerId}`)
        ]);
        setVehicles(vData || []);
        setLeads(lData || []);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [dealerId]);

  const activeListings = vehicles.length;
  const totalLeads = leads.length;
  const pipelineValue = leads
    .filter(l => l.status !== "lost")
    .reduce((sum, l) => sum + (l.budget || 0), 0);
  
  const wonLeads = leads.filter(l => l.status === "won").length;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(2) : "0.00";
  
  const totalViews = activeListings * 125;

  const stats = [
    { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye, trend: "+12.5%", up: true },
    { label: "Enquiries", value: totalLeads.toString(), icon: Phone, trend: "+8.2%", up: true },
    { label: "Active Listings", value: activeListings.toString(), icon: Car, trend: "+3", up: true },
    { label: "Conversion Rate", value: `${conversionRate}%`, icon: TrendingUp, trend: "-0.3%", up: false },
    { label: "Pipeline Value", value: `₹${(pipelineValue / 100000).toFixed(1)}L`, icon: IndianRupee, trend: "+15%", up: true },
  ];

  return (
    <div className="space-y-6">
      {isLoading && <div className="text-sm text-muted-foreground mb-4">Refreshing dashboard data...</div>}
      
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className={`text-xs font-medium flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
                    stat.up ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
                  }`}>
                    {stat.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {stat.trend}
                  </span>
                </div>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Views & Enquiries Chart */}
        <Card className="border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Views & Enquiries (This Week)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="enqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid hsl(220 13% 91%)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="views" stroke="var(--color-primary)" fill="url(#viewsGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="enquiries" stroke="var(--color-accent)" fill="url(#enqGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Enquiry Sources */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Enquiry Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="value"
                    stroke="none"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {sourceData.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/55 transition-colors">
                <div className={`h-2 w-2 rounded-full shrink-0 ${
                  item.type === "enquiry" ? "bg-orange-500" :
                  item.type === "view" ? "bg-primary" :
                  item.type === "boost" ? "bg-destructive" : "bg-emerald-500"
                }`} />
                <p className="text-sm text-foreground flex-1">{item.text}</p>
                <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
