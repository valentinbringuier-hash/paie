"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  FileWarning,
  RotateCcw,
} from "lucide-react";
import { Answers, FLOWS, FlowType, Question, labelOf } from "./lib/evpEngine";

function statusClasses(status: string) {
  if (status === "Oui") return "bg-green-100 text-green-800 border-green-200";
  if (status === "Partiellement") return "bg-orange-100 text-orange-800 border-orange-200";
  return "bg-red-100 text-red-800 border-red-200";
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

function PanelHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {right}
    </div>
  );
}

function PanelBody({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-5">{children}</div>;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-slate-900 transition-all duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function HomeCards({
  onStart,
}: {
  onStart: (flow: Exclude<FlowType, null>) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Object.entries(FLOWS).map(([id, config]) => (
        <button
          key={id}
          type="button"
          onClick={() => onStart(id as Exclude<FlowType, null>)}
          className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            Démarrer
          </div>
          <div className="text-xl font-semibold text-slate-900">{config.title}</div>
          <p className="mt-2 text-sm text-slate-600">{config.desc}</p>
        </button>
      ))}
    </div>
  );
}

function QuestionBlock({
  question,
  step,
  total,
  value,
  onChange,
  onNext,
  canNext,
}: {
  question: {
    id: string;
    label: string;
    type: "choice" | "text" | "number";
    options?: { value: string; label: string }[];
    placeholder?: string;
  };
  step: number;
  total: number;
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  canNext: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-slate-500">
          Question {step + 1} / {total}
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-900">{question.label}</h2>
      </div>

      {question.type === "choice" && question.options && (
        <div className="grid gap-3 sm:grid-cols-2">
          {question.options.map((opt) => {
            const selected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-900 hover:border-slate-400"
                }`}
              >
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {question.type === "text" && (
        <input
          value={value}
          placeholder={question.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-500"
        />
      )}

      {question.type === "number" && (
        <input
          type="number"
          value={value}
          placeholder={question.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-500"
        />
      )}

      <div className="pt-2">
        <button
          disabled={!canNext}
          onClick={onNext}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continuer
        </button>
      </div>
    </div>
  );
}

function ResultBlock({
  result,
}: {
  result: {
    qualification: string;
    traitement: string;
    bulletin: string;
    technique: string;
    securisee: string;
    vigilance: string[];
    prochaineAction: string;
  };
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-slate-500">Résultat</p>
        <h2 className="mt-1 text-3xl font-semibold text-slate-900">Orientation paie proposée</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <PanelHeader title="Qualification" />
          <PanelBody>
            <p className="text-sm leading-6 text-slate-700">{result.qualification}</p>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Traitement" />
          <PanelBody>
            <p className="text-sm leading-6 text-slate-700">{result.traitement}</p>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Sortie bulletin" />
          <PanelBody>
            <p className="text-sm leading-6 text-slate-700">{result.bulletin}</p>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Action suivante" />
          <PanelBody>
            <p className="text-sm font-medium leading-6 text-slate-900">{result.prochaineAction}</p>
          </PanelBody>
        </Panel>
      </div>

      <div className="flex flex-wrap gap-3">
        <span className={`rounded-full border px-3 py-1 text-sm font-medium ${statusClasses(result.technique)}`}>
          Réponse technique : {result.technique}
        </span>
        <span className={`rounded-full border px-3 py-1 text-sm font-medium ${statusClasses(result.securisee)}`}>
          Réponse sécurisée : {result.securisee}
        </span>
      </div>

      <Panel>
        <PanelHeader title="Vigilances" />
        <PanelBody>
          {result.vigilance.length ? (
            <ul className="space-y-2 text-sm text-slate-700">
              {result.vigilance.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Aucune vigilance majeure détectée à ce niveau de qualification.</span>
            </div>
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}

function getVisibleQuestions(questions: Question[], answers: Answers) {
  return questions.filter((q) => !q.showIf || q.showIf(answers));
}

function pruneHiddenAnswers(questions: Question[], nextAnswers: Answers) {
  let current = nextAnswers;

  for (let attempt = 0; attempt < questions.length; attempt += 1) {
    const visibleIds = new Set(getVisibleQuestions(questions, current).map((question) => question.id));
    const pruned = Object.fromEntries(
      Object.entries(current).filter(([id]) => visibleIds.has(id)),
    ) as Answers;

    if (Object.keys(pruned).length === Object.keys(current).length) {
      return pruned;
    }

    current = pruned;
  }

  return current;
}

export default function Page() {
  const [flow, setFlow] = useState<FlowType>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [copied, setCopied] = useState(false);

  const currentFlow = flow ? FLOWS[flow] : null;

  const allQuestions = useMemo(() => currentFlow?.questions ?? [], [currentFlow]);

  const visibleQuestions = useMemo(() => {
    return getVisibleQuestions(allQuestions, answers);
  }, [allQuestions, answers]);

  const visibleEntries = useMemo(() => {
    const visibleIds = new Set(visibleQuestions.map((question) => question.id));
    return Object.entries(answers).filter(([id]) => visibleIds.has(id));
  }, [answers, visibleQuestions]);

  const currentQuestion = visibleQuestions[step] || null;
  const result = currentFlow && !currentQuestion ? currentFlow.infer(answers) : null;

  const progress = flow
    ? Math.round((Math.min(step, visibleQuestions.length) / Math.max(visibleQuestions.length, 1)) * 100)
    : 0;

  const updateAnswer = (id: string, value: string) => {
    setAnswers((prev) => pruneHiddenAnswers(allQuestions, { ...prev, [id]: value }));
  };

  const resetAll = () => {
    setFlow(null);
    setStep(0);
    setAnswers({});
    setCopied(false);
  };

  const startFlow = (nextFlow: Exclude<FlowType, null>) => {
    setFlow(nextFlow);
    setStep(0);
    setAnswers({});
    setCopied(false);
  };

  const getQuestionLabel = (questionId: string) => {
    return allQuestions.find((q) => q.id === questionId)?.label ?? questionId;
  };

  const getAnswerLabel = (questionId: string, value: string) => {
    const question = allQuestions.find((q) => q.id === questionId);
    if (!question) return value;
    if (question.type === "choice") return labelOf(question.options, value);
    return value;
  };

  const canNext = currentQuestion ? Boolean(String(answers[currentQuestion.id] ?? "").trim()) : false;

  const syntheseTexte = result
    ? [
        "Synthèse EVP",
        `Parcours : ${currentFlow?.title ?? ""}`,
        "",
        "Réponses",
        ...visibleEntries.map(([k, v]) => `- ${getQuestionLabel(k)} : ${getAnswerLabel(k, v)}`),
        "",
        "Résultat",
        `- Qualification : ${result.qualification}`,
        `- Traitement : ${result.traitement}`,
        `- Sortie bulletin : ${result.bulletin}`,
        `- Réponse technique : ${result.technique}`,
        `- Réponse sécurisée : ${result.securisee}`,
        `- Action suivante : ${result.prochaineAction}`,
        ...(result.vigilance.length
          ? ["- Vigilances :", ...result.vigilance.map((x) => `  • ${x}`)]
          : ["- Vigilances : aucune"]),
      ].join("\n")
    : "";

  const copySynthese = async () => {
    if (!syntheseTexte) return;
    try {
      await navigator.clipboard.writeText(syntheseTexte);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">
                Prototype paie v6
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">Assistant EVP interactif</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300">
                Outil en entonnoir pour guider la qualification, le traitement paie, la sortie bulletin
                et le niveau de sécurisation d&apos;un cas EVP.
              </p>
            </div>

            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
            >
              <RotateCcw className="h-4 w-4" />
              Recommencer
            </button>
          </div>
        </div>

        {!flow && <HomeCards onStart={startFlow} />}

        {flow && currentFlow && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Panel>
              <PanelHeader
                title="Parcours guidé"
                right={
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {currentFlow.title}
                  </span>
                }
              />
              <PanelBody>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                      <span>Progression</span>
                      <span>{progress}%</span>
                    </div>
                    <ProgressBar value={progress} />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (step === 0) resetAll();
                        else setStep((s) => Math.max(0, s - 1));
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Retour
                    </button>

                    {!currentQuestion && result && (
                      <>
                        <button
                          type="button"
                          onClick={copySynthese}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Copy className="h-4 w-4" />
                          {copied ? "Synthèse copiée" : "Copier la synthèse"}
                        </button>

                        <button
                          type="button"
                          onClick={() => startFlow(flow)}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Nouveau cas du même type
                        </button>
                      </>
                    )}
                  </div>

                  {currentQuestion ? (
                    <QuestionBlock
                      question={currentQuestion}
                      step={step}
                      total={visibleQuestions.length}
                      value={answers[currentQuestion.id] || ""}
                      onChange={(value) => updateAnswer(currentQuestion.id, value)}
                      onNext={() => setStep((s) => s + 1)}
                      canNext={canNext}
                    />
                  ) : result ? (
                    <ResultBlock result={result} />
                  ) : null}
                </div>
              </PanelBody>
            </Panel>

            <div className="space-y-6">
              <Panel>
                <PanelHeader title="Réponses en cours" />
                <PanelBody>
                  {visibleEntries.length === 0 ? (
                    <p className="text-sm text-slate-500">Aucune réponse pour le moment.</p>
                  ) : (
                    <div className="space-y-3 text-sm">
                      {visibleEntries.map(([k, val]) => (
                        <div key={k} className="rounded-2xl border border-slate-200 p-3">
                          <div className="font-medium text-slate-900">{getQuestionLabel(k)}</div>
                          <div className="mt-1 text-slate-600">{getAnswerLabel(k, val)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </PanelBody>
              </Panel>

              {result && (
                <Panel>
                  <PanelHeader title="Synthèse prête à partager" />
                  <PanelBody>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <pre className="whitespace-pre-wrap text-xs leading-6 text-slate-700">
                        {syntheseTexte}
                      </pre>
                    </div>
                  </PanelBody>
                </Panel>
              )}

              <Panel>
                <PanelHeader title="Pourquoi ce format ?" />
                <PanelBody>
                  <div className="space-y-3 text-sm text-slate-700">
                    <p>Cette version sépare mieux l&apos;interface, les blocs de rendu et le moteur métier.</p>
                    <p>Tu peux maintenant enrichir les règles dans `app/lib/evpEngine.ts` sans alourdir la page.</p>
                    <div className="rounded-2xl bg-slate-100 p-4">
                      <div className="flex items-start gap-2">
                        <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" />
                        <p>
                          La prochaine étape logique est de passer d&apos;un tunnel unitaire à une V2
                          dossier multi-EVP avec synthèse transverse.
                        </p>
                      </div>
                    </div>
                  </div>
                </PanelBody>
              </Panel>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
