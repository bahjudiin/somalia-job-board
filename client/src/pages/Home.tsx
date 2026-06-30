import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Briefcase, Calendar, ExternalLink, TrendingUp, Loader2, PlusCircle } from "lucide-react";
import { Link } from "wouter";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  date_posted: string;
  deadline: string;
  description: string;
  url: string;
  source: string;
  engagement: number;
}

const FALLBACK_JOBS: Job[] = [
  {
    id: 1, title: "Information Management Officer", company: "DRC – Danish Refugee Council",
    location: "Mogadishu, Somalia", type: "NGO", date_posted: "4 weeks ago",
    deadline: "June 07, 2026", description: "Support effective management, quality assurance, analysis, and utilization of programmatic data.",
    url: "https://qaranjobs.com/job/information-management-officer-mogadishu-somalia-15/",
    source: "QaranJobs", engagement: 45
  },
  {
    id: 2, title: "Advocacy Specialist", company: "UNICEF",
    location: "Mogadishu, Somalia", type: "NGO", date_posted: "4 weeks ago",
    deadline: "June 02, 2026", description: "Lead advocacy initiatives and communications for child protection programs.",
    url: "https://qaranjobs.com/job/advocacy-specialist-no-3-fixed-term-position-mogadishu-somalia/",
    source: "QaranJobs", engagement: 52
  },
  {
    id: 3, title: "Chief Supply and Logistics", company: "UNICEF",
    location: "Mogadishu, Somalia", type: "NGO", date_posted: "May 16, 2026",
    deadline: "May 28, 2026", description: "Oversee supply chain management and logistics operations for humanitarian programs.",
    url: "https://qaranjobs.com/job/chief-supply-and-logistics-p-4-fixed-term-position-mogadishu-somalia/",
    source: "QaranJobs", engagement: 38
  },
  {
    id: 4, title: "Senior Political Analysis and Programme Monitoring Specialist", company: "CTG",
    location: "Mogadishu, Somalia", type: "NGO", date_posted: "May 13, 2026",
    deadline: "May 16, 2026", description: "Monitor political developments and program implementation across Somalia.",
    url: "https://qaranjobs.com/job/senior-political-analysis-and-programme-monitoring-specialist-mogadishu-somalia/",
    source: "QaranJobs", engagement: 41
  },
  {
    id: 5, title: "Stakeholder Engagement Specialist", company: "Federal Government of Somalia",
    location: "Multiple locations across Somalia", type: "Government", date_posted: "Recent",
    deadline: "March 15, 2026", description: "Coordinate stakeholder engagement and community relations.",
    url: "https://somalijobs.com/jobs/somalia/12448195797031128/stakeholder-engagement-specialist",
    source: "SomaliJobs", engagement: 33
  }
];

const PIE_COLORS: Record<string, string> = {
  NGO: "#5a9fa5",
  Government: "#7ab5bc",
  Private: "#8b6f47",
  Remote: "#1a3a52",
  Other: "#a8a5a0"
};

function computeChartData(jobs: Job[]) {
  const typeCount: Record<string, number> = {};
  jobs.forEach(j => { typeCount[j.type] = (typeCount[j.type] || 0) + 1; });
  const byType = Object.entries(typeCount).map(([name, value]) => ({
    name, value, color: PIE_COLORS[name] || "#a8a5a0"
  }));
  const categoryStats = Object.entries(typeCount).map(([category, count]) => ({ category, count }));
  return { byType, categoryStats };
}

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>(FALLBACK_JOBS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [sortBy, setSortBy] = useState("engagement");

  useEffect(() => {
    fetch("/jobs.json")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length) setJobs(data); })
      .catch(() => { /* use fallback */ })
      .finally(() => setLoading(false));
  }, []);

  const sources = useMemo(() =>
    Array.from(new Set(jobs.map(j => j.source))).sort(), [jobs]);

  const filteredJobs = useMemo(() => {
    let filtered = jobs.filter(job => {
      const q = searchTerm.toLowerCase();
      return (job.title.toLowerCase().includes(q) ||
              job.company.toLowerCase().includes(q) ||
              job.location.toLowerCase().includes(q)) &&
             (selectedType === "all" || job.type === selectedType) &&
             (selectedSource === "all" || job.source === selectedSource);
    });
    if (sortBy === "engagement") filtered.sort((a, b) => b.engagement - a.engagement);
    else if (sortBy === "recent") filtered.sort((a, b) => new Date(b.date_posted).getTime() - new Date(a.date_posted).getTime());
    return filtered;
  }, [searchTerm, selectedType, selectedSource, sortBy, jobs]);

  const chartData = useMemo(() => computeChartData(jobs), [jobs]);

  const engagementTrend = [
    { week: "Week 1", engagement: 120 },
    { week: "Week 2", engagement: 185 },
    { week: "Week 3", engagement: 215 },
    { week: "Week 4", engagement: 280 },
    { week: "Current", engagement: jobs.reduce((s, j) => s + j.engagement, 0) }
  ];

  const totalEngagement = jobs.reduce((s, j) => s + j.engagement, 0);
  const ngoCount = jobs.filter(j => j.type === "NGO").length;
  const sourcesList = Array.from(new Set(jobs.map(j => j.source))).sort();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: "'Georgia', serif" }}>
              Somalia Job Board
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/submit">
              <Button variant="ghost" size="sm" className="gap-1.5 text-sm">
                <PlusCircle className="w-4 h-4" /> Submit Job
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Discover jobs across Somalia
            </p>
          </div>
        </div>
      </header>

      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
        <div className="container relative z-10">
          <div className="max-w-2xl">
            <h2 className="text-4xl sm:text-5xl font-bold text-primary mb-4" style={{ fontFamily: "'Georgia', serif" }}>
              Discover Your Next Impact
            </h2>
            <p className="text-lg text-foreground/80 mb-8">
              Explore opportunities with NGOs, government agencies, and development organizations across Somalia.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by job title, company, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 py-3 bg-white/90"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-white/80 backdrop-blur rounded-lg p-3">
                <div className="text-2xl font-bold text-accent">{jobs.length}</div>
                <div className="text-muted-foreground">Active Listings</div>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-lg p-3">
                <div className="text-2xl font-bold text-secondary">{ngoCount}</div>
                <div className="text-muted-foreground">NGO Roles</div>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-lg p-3">
                <div className="text-2xl font-bold text-primary">{totalEngagement}</div>
                <div className="text-muted-foreground">Total Engagement</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-4 mb-8 items-start sm:items-center">
                <div className="flex-1">
                  <label className="text-sm font-semibold text-foreground mb-2 block">Filter by Type</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="NGO">NGO</SelectItem>
                      <SelectItem value="Government">Government</SelectItem>
                      <SelectItem value="Private">Private Sector</SelectItem>
                      <SelectItem value="Remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-semibold text-foreground mb-2 block">Filter by Source</label>
                  <Select value={selectedSource} onValueChange={setSelectedSource}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      {sources.map(source => (
                        <SelectItem key={source} value={source}>{source}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-semibold text-foreground mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engagement">Highest Engagement</SelectItem>
                      <SelectItem value="recent">Most Recent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground pt-4 sm:pt-0">
                  {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
                </div>
              </div>

              <div className="grid gap-4 mb-12">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map(job => (
                    <Card key={job.id} className="p-6 hover:shadow-lg transition-shadow duration-200 border-border">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-3">
                            <Briefcase className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                            <div>
                              <h3 className="text-lg font-semibold text-primary" style={{ fontFamily: "'Georgia', serif" }}>
                                {job.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">{job.company}</p>
                            </div>
                          </div>
                          <p className="text-sm text-foreground/70 mb-4">{job.description}</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
                              {job.type}
                            </Badge>
                            {job.source && (
                              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 text-xs">
                                {job.source}
                              </Badge>
                            )}
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {job.location}
                            </Badge>
                            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {job.date_posted}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <TrendingUp className="w-3 h-3 text-accent" />
                            <span>{job.engagement} visitors</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:items-end">
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity duration-200 font-semibold text-sm"
                          >
                            View Job
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <p className="text-xs text-muted-foreground text-right">
                            Deadline: {job.deadline}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-12 text-center border-border">
                    <p className="text-muted-foreground mb-4">No jobs match your search criteria.</p>
                    <Button variant="outline" onClick={() => { setSearchTerm(""); setSelectedType("all"); }}>
                      Clear Filters
                    </Button>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {!loading && (
        <section className="py-16 bg-primary/5">
          <div className="container">
            <h2 className="text-3xl font-bold text-primary mb-12" style={{ fontFamily: "'Georgia', serif" }}>
              Job Market Insights
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card className="p-8 border-border">
                <h3 className="text-xl font-semibold text-primary mb-6" style={{ fontFamily: "'Georgia', serif" }}>
                  Distribution by Sector
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={chartData.byType} cx="50%" cy="50%" labelLine={false}
                      label={({ name, value }) => `${name} (${value})`} outerRadius={80}
                      fill="#8884d8" dataKey="value">
                      {chartData.byType.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
              <Card className="p-8 border-border">
                <h3 className="text-xl font-semibold text-primary mb-6" style={{ fontFamily: "'Georgia', serif" }}>
                  Engagement Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={engagementTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e5dd" />
                    <XAxis dataKey="week" stroke="#6b6b6b" />
                    <YAxis stroke="#6b6b6b" />
                    <Tooltip contentStyle={{ backgroundColor: "#faf8f3", border: "1px solid #e8e5dd" }} labelStyle={{ color: "#2c2c2c" }} />
                    <Line type="monotone" dataKey="engagement" stroke="#d4a574" strokeWidth={3} dot={{ fill: "#d4a574", r: 5 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
            <Card className="p-8 border-border">
              <h3 className="text-xl font-semibold text-primary mb-6" style={{ fontFamily: "'Georgia', serif" }}>
                Opportunities by Category
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.categoryStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e5dd" />
                  <XAxis dataKey="category" stroke="#6b6b6b" />
                  <YAxis stroke="#6b6b6b" />
                  <Tooltip contentStyle={{ backgroundColor: "#faf8f3", border: "1px solid #e8e5dd" }} labelStyle={{ color: "#2c2c2c" }} />
                  <Bar dataKey="count" fill="#5a9fa5" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </section>
      )}

      <footer className="bg-primary text-primary-foreground py-12">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4" style={{ fontFamily: "'Georgia', serif" }}>About</h4>
              <p className="text-sm text-primary-foreground/80">
                Somalia Job Board aggregates job listings from local Somali job sites so you never miss an opportunity.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4" style={{ fontFamily: "'Georgia', serif" }}>Sources</h4>
              <ul className="text-sm text-primary-foreground/80 space-y-2">
                {sourcesList.map(s => (
                  <li key={s}>{s}</li>
                ))}
                <li className="pt-2 border-t border-primary-foreground/20">
                  <span className="text-xs opacity-70">Data auto-collected from Somali job sites & Telegram</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4" style={{ fontFamily: "'Georgia', serif" }}>Contact</h4>
              <p className="text-sm text-primary-foreground/80">
                For inquiries about job listings, please reach out to the respective organizations directly.
              </p>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 pt-8 text-center text-sm text-primary-foreground/70">
            <p>&copy; 2026 Somalia Job Board | Data aggregated automatically</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
