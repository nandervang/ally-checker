import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/Header";
import { Main } from "@/components/Main";
import { Footer } from "@/components/Footer";
import { Clock, Filter, Search, Trash2, Eye, Download, ExternalLink } from "lucide-react";
import type { AuditResult } from "@/data/mockAuditResults";

// Mock data for history (in real app, this would come from Supabase)
const mockHistory: AuditResult[] = [
  {
    url: "https://example.com",
    documentType: "html",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    summary: {
      totalIssues: 12,
      critical: 3,
      serious: 4,
      moderate: 3,
      minor: 2,
      passed: 15,
      failed: 12,
    },
    issues: [],
  },
  {
    fileName: "annual-report-2024.pdf",
    documentType: "pdf",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    summary: {
      totalIssues: 8,
      critical: 2,
      serious: 3,
      moderate: 2,
      minor: 1,
      passed: 10,
      failed: 8,
    },
    issues: [],
  },
  {
    fileName: "accessibility-statement.docx",
    documentType: "docx",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    summary: {
      totalIssues: 6,
      critical: 1,
      serious: 2,
      moderate: 2,
      minor: 1,
      passed: 8,
      failed: 6,
    },
    issues: [],
  },
  {
    url: "https://test-site.com",
    documentType: "html",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    summary: {
      totalIssues: 5,
      critical: 0,
      serious: 2,
      moderate: 2,
      minor: 1,
      passed: 20,
      failed: 5,
    },
    issues: [],
  },
];

export function AuditHistory() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const filteredHistory = mockHistory
    .filter((audit) => {
      // Filter by type
      if (filterType !== "all" && audit.documentType !== filterType) return false;
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesUrl = audit.url?.toLowerCase().includes(query);
        const matchesFile = audit.fileName?.toLowerCase().includes(query);
        return matchesUrl || matchesFile;
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortBy === "mostIssues") {
        return b.summary.totalIssues - a.summary.totalIssues;
      }
      return 0;
    });

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return t("history.time.justNow");
    if (diffInSeconds < 3600) return t("history.time.minutesAgo", { count: Math.floor(diffInSeconds / 60) });
    if (diffInSeconds < 86400) return t("history.time.hoursAgo", { count: Math.floor(diffInSeconds / 3600) });
    if (diffInSeconds < 604800) return t("history.time.daysAgo", { count: Math.floor(diffInSeconds / 86400) });
    return date.toLocaleDateString();
  };

  const getSeverityColor = (critical: number, serious: number) => {
    if (critical > 0) return "text-red-600 dark:text-red-400";
    if (serious > 0) return "text-orange-600 dark:text-orange-400";
    return "text-green-600 dark:text-green-400";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <Main>
        <div className="h-full w-full px-6 py-8 max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 flex items-center gap-3">
              <Clock className="h-10 w-10" />
              {t("history.title")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              {t("history.description")}
            </p>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6 shadow-elevation-2">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Filter className="h-5 w-5" />
                {t("history.filters.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("history.filters.search")}
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); }}
                    className="pl-10"
                  />
                </div>

                {/* Type Filter */}
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("history.filters.type")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("history.filters.types.all")}</SelectItem>
                    <SelectItem value="html">{t("history.filters.types.html")}</SelectItem>
                    <SelectItem value="pdf">{t("history.filters.types.pdf")}</SelectItem>
                    <SelectItem value="docx">{t("history.filters.types.docx")}</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort By */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("history.filters.sortBy")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t("history.filters.sortOptions.newest")}</SelectItem>
                    <SelectItem value="oldest">{t("history.filters.sortOptions.oldest")}</SelectItem>
                    <SelectItem value="mostIssues">{t("history.filters.sortOptions.mostIssues")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {t("history.filters.showing", { count: filteredHistory.length, total: mockHistory.length })}
                </span>
                {(searchQuery || filterType !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterType("all");
                    }}
                  >
                    {t("history.filters.clearFilters")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* History List */}
          <div className="space-y-4">
            {filteredHistory.length === 0 ? (
              <Card className="shadow-elevation-2">
                <CardContent className="py-12 text-center">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">{t("history.empty.title")}</h3>
                  <p className="text-muted-foreground mb-4">{t("history.empty.description")}</p>
                  <Button onClick={() => window.location.href = "/"}>
                    {t("history.empty.action")}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredHistory.map((audit, index) => (
                <Card key={index} className="shadow-elevation-2 hover:shadow-elevation-3 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1">
                          {audit.url && (
                            <a href={audit.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-2">
                              {audit.url}
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          {audit.fileName && (
                            <span className="flex items-center gap-2">
                              {audit.fileName}
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-3 flex-wrap">
                          <Badge variant="outline" className="uppercase">
                            {audit.documentType}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(audit.timestamp)}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" title={t("history.actions.view")}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" title={t("history.actions.download")}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" title={t("history.actions.delete")} className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className={`text-2xl font-bold ${getSeverityColor(audit.summary.critical, audit.summary.serious)}`}>
                          {audit.summary.totalIssues}
                        </div>
                        <div className="text-xs text-muted-foreground">{t("history.stats.total")}</div>
                      </div>
                      <div className="text-center p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                          {audit.summary.critical}
                        </div>
                        <div className="text-xs text-red-600 dark:text-red-300">{t("history.stats.critical")}</div>
                      </div>
                      <div className="text-center p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                          {audit.summary.serious}
                        </div>
                        <div className="text-xs text-orange-600 dark:text-orange-300">{t("history.stats.serious")}</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                          {audit.summary.moderate}
                        </div>
                        <div className="text-xs text-yellow-600 dark:text-yellow-300">{t("history.stats.moderate")}</div>
                      </div>
                      <div className="text-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                          {audit.summary.minor}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-300">{t("history.stats.minor")}</div>
                      </div>
                      <div className="text-center p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                          {audit.summary.passed}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-300">{t("history.stats.passed")}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </Main>
      <Footer />
    </div>
  );
}
