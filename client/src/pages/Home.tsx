import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MapPin,
  Calendar,
  ExternalLink,
  Loader2,
  Bookmark,
  BookmarkCheck,
  Clock,
  Filter,
} from "lucide-react";

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  date_posted: string;
  description: string;
  url: string;
  original_url: string | null;
  source: string;
  engagement: number;
}

interface SavedJob {
  id: number;
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
}

const FALLBACK_JOBS: Job[] = [
  {
    id: 1,
    title: "Loading jobs...",
    company: "Please wait",
    location: "Somalia",
    type: "NGO",
    date_posted: "Recent",
    description: "Fetching latest jobs from Somali job sources.",
    url: "#",
    original_url: null,
    source: "System",
    engagement: 0,
  },
];

const TIME_FILTERS = [
  { label: "24h", ms: 24 * 60 * 60 * 1000 },
  { label: "1 week", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "1 month", ms: 30 * 24 * 60 * 60 * 1000 },
  { label: "All", ms: Infinity },
] as const;

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>(FALLBACK_JOBS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedJobIds, setSavedJobIds] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("saved_jobs") || "[]");
    } catch {
      return [];
    }
  });

  const [filters, setFilters] = useState({
    location: [] as string[],
    type: [] as string[],
    source: [] as string[],
  });

  const [timeFilter, setTimeFilter] = useState<keyof typeof TIME_FILTERS>("All");

  useEffect(() => {
    fetch("/jobs.json")
      .then((res) => res.json())
      .then((data) => {
        const manualJobs = JSON.parse(localStorage.getItem("manual_jobs") || "[]");
        const mapped = manualJobs.map((mj: any, i: number) => ({
          id: 90000 + i,
          title: mj.title || "Untitled",
          company: mj.company || "Unknown",
          location: mj.location || "Somalia",
          type: mj.type || "NGO",
          date_posted: mj.date_posted || new Date().toISOString().split("T")[0],
          description: mj.description || "",
          url: mj.url || "#",
          original_url: mj.url || null,
          source: mj.source || "Manual",
          engagement: 0,
        }));
        setJobs([...mapped, ...data]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    localStorage.setItem("saved_jobs", JSON.stringify(savedJobIds));
  }, [savedJobIds]);

  const toggleSave = (job: Job) => {
    setSavedJobIds((prev) => {
      const isSaved = prev.includes(job.id);
      if (isSaved) {
        const data = JSON.parse(localStorage.getItem("saved_jobs_data") || "[]");
        localStorage.setItem(
          "saved_jobs_data",
          JSON.stringify(data.filter((j: SavedJob) => j.id !== job.id))
        );
        return prev.filter((id) => id !== job.id);
      } else {
        const data = JSON.parse(localStorage.getItem("saved_jobs_data") || "[]");
        data.push({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          url: job.original_url || job.url,
          source: job.source,
        });
        localStorage.setItem("saved_jobs_data", JSON.stringify(data));
        return [...prev, job.id];
      }
    });
  };

  const availableLocations = useMemo(() => {
    const locs = new Set(jobs.map((j) => j.location).filter(Boolean));
    return Array.from(locs).sort();
  }, [jobs]);

  const availableTypes = useMemo(() => {
    const types = new Set(jobs.map((j) => j.type).filter(Boolean));
    return Array.from(types).sort();
  }, [jobs]);

  const availableSources = useMemo(() => {
    const sources = new Set(jobs.map((j) => j.source).filter(Boolean));
    return Array.from(sources).sort();
  }, [jobs]);

  const isWithinTimeFilter = (job: Job): boolean => {
    if (timeFilter === "All") return true;
    if (!job.date_posted || job.date_posted === "Recent") return true;
    const jobDate = new Date(job.date_posted);
    if (isNaN(jobDate.getTime())) return true;
    const ms = TIME_FILTERS.find((f) => f.label === timeFilter)?.ms ?? Infinity;
    return Date.now() - jobDate.getTime() <= ms;
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (!isWithinTimeFilter(job)) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.location.toLowerCase().includes(q) ||
          job.description.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filters.location.length > 0 && !filters.location.includes(job.location)) {
        return false;
      }
      if (filters.type.length > 0 && !filters.type.includes(job.type)) {
        return false;
      }
      if (filters.source.length > 0 && !filters.source.includes(job.source)) {
        return false;
      }
      return true;
    });
  }, [jobs, searchQuery, filters, timeFilter]);

  const toggleFilter = (category: "location" | "type" | "source", value: string) => {
    setFilters((prev) => {
      const current = prev[category];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [category]: next };
    });
  };

  const activeFilterCount =
    filters.location.length + filters.type.length + filters.source.length +
    (timeFilter !== "All" ? 1 : 0);

  const totalJobs = filteredJobs.length;
  const ngoJobs = filteredJobs.filter((j) => j.type === "NGO").length;
  const totalEngagement = filteredJobs.reduce((sum, j) => sum + j.engagement, 0);

  return (
    <div className="container py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold italic text-foreground mb-6">
          Find your next impact
        </h1>
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Time Filter Bar */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground mr-1">Posted:</span>
        {TIME_FILTERS.map((f) => (
          <Button
            key={f.label}
            variant={timeFilter === f.label ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeFilter(f.label)}
            className="h-8 text-xs"
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Active Listings", value: totalJobs },
          { label: "NGO Roles", value: ngoJobs },
          { label: "Total Engagement", value: totalEngagement },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 bg-card border-border text-center">
            <div className="text-3xl font-bold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <aside className="space-y-6">
          {/* Source Filter */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Source
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableSources.map((source) => (
                <label
                  key={source}
                  className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filters.source.includes(source)}
                    onChange={() => toggleFilter("source", source)}
                    className="w-4 h-4 rounded border-border bg-card accent-primary"
                  />
                  {source}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Location</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableLocations.map((loc) => (
                <label
                  key={loc}
                  className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filters.location.includes(loc)}
                    onChange={() => toggleFilter("location", loc)}
                    className="w-4 h-4 rounded border-border bg-card accent-primary"
                  />
                  {loc}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Type</h3>
            <div className="space-y-2">
              {availableTypes.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filters.type.includes(type)}
                    onChange={() => toggleFilter("type", type)}
                    className="w-4 h-4 rounded border-border bg-card accent-primary"
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilters({ location: [], type: [], source: [] });
                setTimeFilter("All");
              }}
              className="text-xs text-muted-foreground"
            >
              Clear all filters ({activeFilterCount})
            </Button>
          )}
        </aside>

        <div>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No jobs found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredJobs.map((job) => (
                <Card
                  key={job.id}
                  className="p-4 bg-card border-border hover:border-primary/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
                      {job.title}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => toggleSave(job)}
                    >
                      {savedJobIds.includes(job.id) ? (
                        <BookmarkCheck className="w-4 h-4 text-primary" />
                      ) : (
                        <Bookmark className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground mb-2">{job.company}</p>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {job.date_posted}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {job.source}
                    </Badge>
                    <a
                      href={job.original_url || job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        className="h-7 text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        View Details
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
