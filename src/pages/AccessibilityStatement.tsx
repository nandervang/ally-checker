import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/Header";
import { Main } from "@/components/Main";
import { Footer } from "@/components/Footer";
import { FileText, Calendar, Mail, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";

export function AccessibilityStatement() {
  const { t } = useTranslation();
  
  const currentDate = new Date().toLocaleDateString();
  const wcagStandards = [
    { level: "A", criteria: 30, met: 30 },
    { level: "AA", criteria: 20, met: 18 },
    { level: "AAA", criteria: 28, met: 12 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <Main>
        <div className="h-full w-full px-6 py-8 max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 flex items-center gap-3">
              <FileText className="h-10 w-10" />
              {t("statement.title")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              {t("statement.subtitle")}
            </p>
          </div>

          {/* Commitment Statement */}
          <Card className="mb-6 shadow-elevation-2 border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-2xl">{t("statement.commitment.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg leading-relaxed">
                {t("statement.commitment.description")}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{t("statement.lastUpdated")}: {currentDate}</span>
              </div>
            </CardContent>
          </Card>

          {/* WCAG Conformance */}
          <Card className="mb-6 shadow-elevation-2">
            <CardHeader>
              <CardTitle className="text-2xl">{t("statement.conformance.title")}</CardTitle>
              <CardDescription className="text-base">
                {t("statement.conformance.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {wcagStandards.map((standard) => {
                  const percentage = Math.round((standard.met / standard.criteria) * 100);
                  const isFullyMet = standard.met === standard.criteria;
                  
                  return (
                    <div key={standard.level} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant={isFullyMet ? "default" : "outline"} className="text-lg px-3 py-1">
                            WCAG 2.2 Level {standard.level}
                          </Badge>
                          {isFullyMet ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                          )}
                        </div>
                        <span className="font-semibold text-lg">
                          {standard.met} / {standard.criteria}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        {/* eslint-disable-next-line react/forbid-dom-props */}
                        <div
                          className={`h-3 rounded-full transition-all ${
                            isFullyMet ? "bg-green-500" : "bg-orange-500"
                          }`}
                          style={{ width: `${String(percentage)}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {percentage}% {t("statement.conformance.compliance")}
                      </p>
                    </div>
                  );
                })}
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>{t("statement.conformance.target")}:</strong> {t("statement.conformance.targetDescription")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Accessibility Features */}
          <Card className="mb-6 shadow-elevation-2">
            <CardHeader>
              <CardTitle className="text-2xl">{t("statement.features.title")}</CardTitle>
              <CardDescription className="text-base">
                {t("statement.features.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  t("statement.features.list.keyboard"),
                  t("statement.features.list.screenReader"),
                  t("statement.features.list.contrast"),
                  t("statement.features.list.textSize"),
                  t("statement.features.list.focusIndicators"),
                  t("statement.features.list.skipLinks"),
                  t("statement.features.list.altText"),
                  t("statement.features.list.captions"),
                  t("statement.features.list.formLabels"),
                  t("statement.features.list.errorMessages"),
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Known Limitations */}
          <Card className="mb-6 shadow-elevation-2 border-2 border-orange-300">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-orange-500" />
                {t("statement.limitations.title")}
              </CardTitle>
              <CardDescription className="text-base">
                {t("statement.limitations.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  t("statement.limitations.list.pdfContent"),
                  t("statement.limitations.list.thirdParty"),
                  t("statement.limitations.list.legacyDocuments"),
                ].map((limitation, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                    <span>{limitation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Testing and Feedback */}
          <Card className="mb-6 shadow-elevation-2">
            <CardHeader>
              <CardTitle className="text-2xl">{t("statement.testing.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{t("statement.testing.methodsTitle")}</h3>
                <ul className="space-y-2 ml-6 list-disc">
                  <li>{t("statement.testing.methods.automated")}</li>
                  <li>{t("statement.testing.methods.manual")}</li>
                  <li>{t("statement.testing.methods.screenReader")}</li>
                  <li>{t("statement.testing.methods.userTesting")}</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-lg mb-2">{t("statement.testing.toolsTitle")}</h3>
                <div className="flex flex-wrap gap-2">
                  {["axe DevTools", "WAVE", "NVDA", "JAWS", "VoiceOver", "Lighthouse"].map((tool) => (
                    <Badge key={tool} variant="secondary">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact and Feedback */}
          <Card className="mb-6 shadow-elevation-2 border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Mail className="h-6 w-6" />
                {t("statement.contact.title")}
              </CardTitle>
              <CardDescription className="text-base">
                {t("statement.contact.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base">
                {t("statement.contact.text")}
              </p>
              
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold mb-2">{t("statement.contact.howTo")}</p>
                <ul className="space-y-1 ml-6 list-disc">
                  <li>{t("statement.contact.methods.email")}: <a href="mailto:accessibility@example.com" className="text-primary hover:underline">accessibility@example.com</a></li>
                  <li>{t("statement.contact.methods.form")}: <a href="#" className="text-primary hover:underline">{t("statement.contact.methods.formLink")}</a></li>
                  <li>{t("statement.contact.methods.response")}</li>
                </ul>
              </div>

              <Button size="lg" className="w-full md:w-auto gap-2">
                <Mail className="h-5 w-5" />
                {t("statement.contact.action")}
              </Button>
            </CardContent>
          </Card>

          {/* Technical Specifications */}
          <Card className="shadow-elevation-2">
            <CardHeader>
              <CardTitle className="text-2xl">{t("statement.technical.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{t("statement.technical.compatible")}</h3>
                <ul className="space-y-1 ml-6 list-disc">
                  <li>{t("statement.technical.browsers")}</li>
                  <li>{t("statement.technical.screenReaders")}</li>
                  <li>{t("statement.technical.platforms")}</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">{t("statement.technical.technologies")}</h3>
                <div className="flex flex-wrap gap-2">
                  {["HTML5", "CSS3", "JavaScript", "ARIA", "React", "TypeScript"].map((tech) => (
                    <Badge key={tech} variant="outline">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">{t("statement.technical.standards")}</h3>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    <a href="https://www.w3.org/TR/WCAG22/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      WCAG 2.2 (Level AA)
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    <a href="https://www.w3.org/WAI/ARIA/apg/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      ARIA Authoring Practices Guide
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    <a href="https://www.section508.gov/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Section 508
                    </a>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
      <Footer />
    </div>
  );
}
