"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  FileWarning,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Answers, FLOWS, FlowType, Question, Result, labelOf } from "./lib/evpEngine";

type ActiveFlow = Exclude<FlowType, null>;

type CaseFile = {
  caseId: string;
  title: string;
  period: string;
  convention: string;
  commonRules: string;
  assumptions: string;
};

type EvpLine = {
  id: string;
  employee: string;
  period: string;
  label: string;
  flow: ActiveFlow | null;
  answers: Answers;
  step: number;
};

const DEFAULT_CASE: CaseFile = {
  caseId: "",
  title: "",
  period: "",
  convention: "Syntec",
  commonRules: "",
  assumptions: "",
};

function statusClasses(status: string) {
  if (status === "Oui" || status === "Traitable") {
    return "bg-green-100 text-green-800 border-green-200";
  }

  if (
    status === "Partiellement" ||
    status === "En cours" ||
    status === "Partiellement securisee" ||
    status === "A cadrer"
  ) {
    return "bg-orange-100 text-orange-800 border-orange-200";
  }

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

function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-500"
        />
      ) : (
        <input
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-500"
        />
      )}
    </label>
  );
}

function FlowPicker({
  onSelect,
}: {
  onSelect: (flow: ActiveFlow) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Object.entries(FLOWS).map(([id, config]) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id as ActiveFlow)}
          className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-sm"
        >
          <div className="mb-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            Choisir ce parcours
          </div>
          <div className="text-base font-semibold text-slate-900">{config.title}</div>
          <p className="mt-1 text-sm text-slate-600">{config.desc}</p>
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
  question: Question;
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
          {question.options.map((option) => {
            const selected = value === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={`rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-900 hover:border-slate-400"
                }`}
              >
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {question.type === "text" && (
        <input
          value={value}
          placeholder={question.placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-500"
        />
      )}

      {question.type === "number" && (
        <input
          type="number"
          value={value}
          placeholder={question.placeholder}
          onChange={(event) => onChange(event.target.value)}
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
  result: Result;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-slate-500">Resultat de ligne</p>
        <h2 className="mt-1 text-3xl font-semibold text-slate-900">Orientation EVP proposee</h2>
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
          Reponse technique : {result.technique}
        </span>
        <span className={`rounded-full border px-3 py-1 text-sm font-medium ${statusClasses(result.securisee)}`}>
          Reponse securisee : {result.securisee}
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
              <span>Aucune vigilance majeure detectee a ce niveau de qualification.</span>
            </div>
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}

function getVisibleQuestions(questions: Question[], answers: Answers) {
  return questions.filter((question) => !question.showIf || question.showIf(answers));
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

function createLine(sequence: number, period: string): EvpLine {
  return {
    id: `EVP-${String(sequence).padStart(2, "0")}`,
    employee: "",
    period,
    label: "",
    flow: null,
    answers: {},
    step: 0,
  };
}

function getNextLineSequence(lines: EvpLine[]) {
  const numbers = lines
    .map((line) => Number.parseInt(line.id.replace("EVP-", ""), 10))
    .filter((value) => Number.isFinite(value));

  return (numbers.length ? Math.max(...numbers) : 0) + 1;
}

function inferLineState(line: EvpLine) {
  if (!line.flow) {
    return {
      flowConfig: null,
      questions: [] as Question[],
      visibleQuestions: [] as Question[],
      currentQuestion: null as Question | null,
      result: null as Result | null,
      progress: 0,
      status: "A cadrer",
    };
  }

  const flowConfig = FLOWS[line.flow];
  const visibleQuestions = getVisibleQuestions(flowConfig.questions, line.answers);
  const safeStep = Math.min(line.step, visibleQuestions.length);
  const currentQuestion = visibleQuestions[safeStep] ?? null;
  const result = currentQuestion ? null : flowConfig.infer(line.answers);

  let status = "En cours";

  if (result) {
    if (result.technique === "Oui" && result.securisee === "Oui") {
      status = "Traitable";
    } else if (result.technique === "Non") {
      status = "Bloquee";
    } else if (result.securisee === "Non") {
      status = "Non securisee";
    } else {
      status = "Partiellement securisee";
    }
  }

  return {
    flowConfig,
    questions: flowConfig.questions,
    visibleQuestions,
    currentQuestion,
    result,
    progress: Math.round((Math.min(safeStep, visibleQuestions.length) / Math.max(visibleQuestions.length, 1)) * 100),
    status,
  };
}

function lineSummaryLabel(line: EvpLine) {
  if (line.label.trim()) {
    return line.label.trim();
  }

  if (line.flow) {
    return FLOWS[line.flow].title;
  }

  return "Parcours a choisir";
}

export default function Page() {
  const [caseFile, setCaseFile] = useState<CaseFile>(DEFAULT_CASE);
  const [lines, setLines] = useState<EvpLine[]>([createLine(1, "")]);
  const [selectedLineId, setSelectedLineId] = useState<string>("EVP-01");
  const [copied, setCopied] = useState(false);

  const selectedLine = lines.find((line) => line.id === selectedLineId) ?? lines[0] ?? null;
  const selectedLineState = selectedLine ? inferLineState(selectedLine) : null;

  const summary = useMemo(() => {
    const completedLines = lines.filter((line) => inferLineState(line).result);
    const treatableLines = completedLines.filter((line) => {
      const result = inferLineState(line).result;
      return result?.technique === "Oui" && result.securisee === "Oui";
    });
    const partialLines = completedLines.filter((line) => {
      const result = inferLineState(line).result;
      return Boolean(result) && !(result?.technique === "Oui" && result?.securisee === "Oui") && result?.technique !== "Non";
    });
    const blockedLines = completedLines.filter((line) => inferLineState(line).result?.technique === "Non");
    const unsecuredLines = completedLines.filter((line) => {
      const result = inferLineState(line).result;
      return result?.securisee !== "Oui";
    });

    const mainVigilances = Array.from(
      new Set(
        completedLines
          .flatMap((line) => inferLineState(line).result?.vigilance ?? [])
          .filter(Boolean),
      ),
    ).slice(0, 5);

    return {
      open: lines.length,
      completed: completedLines.length,
      treatable: treatableLines.length,
      partial: partialLines.length,
      blocked: blockedLines.length,
      unsecured: unsecuredLines.length,
      mainVigilances,
    };
  }, [lines]);

  const caseSummaryText = useMemo(() => {
    const lineSummaries = lines.map((line) => {
      const analysis = inferLineState(line);
      const result = analysis.result;

      return [
        `- ${line.id} | ${line.employee || "Salarie a preciser"} | ${lineSummaryLabel(line)}`,
        `  Statut : ${analysis.status}`,
        result ? `  Action suivante : ${result.prochaineAction}` : "  Action suivante : poursuivre le cadrage",
      ].join("\n");
    });

    return [
      "Synthese dossier EVP",
      `ID cas : ${caseFile.caseId || "A preciser"}`,
      `Intitule : ${caseFile.title || "A preciser"}`,
      `Periode : ${caseFile.period || "A preciser"}`,
      `Convention : ${caseFile.convention || "A preciser"}`,
      "",
      `Lignes ouvertes : ${summary.open}`,
      `Lignes completees : ${summary.completed}`,
      `Traitable(s) : ${summary.treatable}`,
      `Partiellement securisee(s) : ${summary.partial}`,
      `Bloquee(s) : ${summary.blocked}`,
      `Non totalement securisee(s) : ${summary.unsecured}`,
      "",
      "Lignes",
      ...lineSummaries,
      "",
      "Points de vigilance",
      ...(summary.mainVigilances.length ? summary.mainVigilances.map((item) => `- ${item}`) : ["- Aucun point majeur detecte pour le moment."]),
    ].join("\n");
  }, [caseFile, lines, summary]);

  const patchCaseFile = (key: keyof CaseFile, value: string) => {
    setCaseFile((current) => ({ ...current, [key]: value }));
  };

  const patchLine = (lineId: string, updater: (line: EvpLine) => EvpLine) => {
    setLines((current) =>
      current.map((line) => {
        if (line.id !== lineId) {
          return line;
        }

        return updater(line);
      }),
    );
  };

  const addLine = () => {
    setLines((current) => {
      const nextLine = createLine(getNextLineSequence(current), caseFile.period);
      setSelectedLineId(nextLine.id);
      return [...current, nextLine];
    });
  };

  const removeLine = (lineId: string) => {
    setLines((current) => {
      if (current.length === 1) {
        setSelectedLineId("EVP-01");
        return [createLine(1, caseFile.period)];
      }

      const nextLines = current.filter((line) => line.id !== lineId);
      const fallback = nextLines[0]?.id ?? "EVP-01";
      setSelectedLineId((currentSelected) => (currentSelected === lineId ? fallback : currentSelected));
      return nextLines;
    });
  };

  const chooseFlow = (flow: ActiveFlow) => {
    if (!selectedLine) {
      return;
    }

    patchLine(selectedLine.id, (line) => ({
      ...line,
      flow,
      answers: {},
      step: 0,
    }));
  };

  const updateSelectedAnswer = (questionId: string, value: string) => {
    if (!selectedLine || !selectedLineState?.flowConfig) {
      return;
    }

    patchLine(selectedLine.id, (line) => {
      const nextAnswers = pruneHiddenAnswers(selectedLineState.flowConfig.questions, {
        ...line.answers,
        [questionId]: value,
      });
      const nextVisibleQuestions = getVisibleQuestions(selectedLineState.flowConfig.questions, nextAnswers);

      return {
        ...line,
        answers: nextAnswers,
        step: Math.min(line.step, nextVisibleQuestions.length),
      };
    });
  };

  const resetSelectedLine = () => {
    if (!selectedLine) {
      return;
    }

    patchLine(selectedLine.id, (line) => ({
      ...line,
      answers: {},
      step: 0,
    }));
  };

  const changeSelectedFlow = () => {
    if (!selectedLine) {
      return;
    }

    patchLine(selectedLine.id, (line) => ({
      ...line,
      flow: null,
      answers: {},
      step: 0,
    }));
  };

  const resetWorkspace = () => {
    setCaseFile(DEFAULT_CASE);
    setLines([createLine(1, "")]);
    setSelectedLineId("EVP-01");
    setCopied(false);
  };

  const copyCaseSummary = async () => {
    try {
      await navigator.clipboard.writeText(caseSummaryText);
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
                V2 lot 1
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">Workspace dossier paie multi-EVP</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300">
                Cette version ne traite plus un seul tunnel. Elle ouvre un dossier, cree des lignes EVP,
                puis utilise l assistant guidé a l interieur de chaque ligne.
              </p>
            </div>

            <button
              type="button"
              onClick={resetWorkspace}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
            >
              <RotateCcw className="h-4 w-4" />
              Reinitialiser le dossier
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Panel className="xl:col-span-1">
            <PanelBody>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">Lignes ouvertes</p>
                <p className="text-3xl font-semibold text-slate-900">{summary.open}</p>
              </div>
            </PanelBody>
          </Panel>

          <Panel className="xl:col-span-1">
            <PanelBody>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">Lignes completees</p>
                <p className="text-3xl font-semibold text-slate-900">{summary.completed}</p>
              </div>
            </PanelBody>
          </Panel>

          <Panel className="xl:col-span-1">
            <PanelBody>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">Traitable(s)</p>
                <p className="text-3xl font-semibold text-green-700">{summary.treatable}</p>
              </div>
            </PanelBody>
          </Panel>

          <Panel className="xl:col-span-1">
            <PanelBody>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">Partielles</p>
                <p className="text-3xl font-semibold text-orange-700">{summary.partial}</p>
              </div>
            </PanelBody>
          </Panel>

          <Panel className="xl:col-span-1">
            <PanelBody>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">Bloquees</p>
                <p className="text-3xl font-semibold text-red-700">{summary.blocked}</p>
              </div>
            </PanelBody>
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_0.9fr_1.2fr]">
          <Panel>
            <PanelHeader title="Dossier" />
            <PanelBody>
              <div className="space-y-4">
                <Field
                  label="ID cas"
                  value={caseFile.caseId}
                  onChange={(value) => patchCaseFile("caseId", value)}
                  placeholder="Ex. CAS-2025-03-EVP"
                />
                <Field
                  label="Intitule"
                  value={caseFile.title}
                  onChange={(value) => patchCaseFile("title", value)}
                  placeholder="Ex. Paie de mars 2025 - cas multi-EVP"
                />
                <Field
                  label="Periode"
                  value={caseFile.period}
                  onChange={(value) => patchCaseFile("period", value)}
                  placeholder="Ex. Mars 2025"
                />
                <Field
                  label="Convention collective"
                  value={caseFile.convention}
                  onChange={(value) => patchCaseFile("convention", value)}
                  placeholder="Ex. Syntec"
                />
                <Field
                  label="Regles communes"
                  value={caseFile.commonRules}
                  onChange={(value) => patchCaseFile("commonRules", value)}
                  placeholder="Ex. HS a 25 % puis 50 %, maladie en jours calendaires..."
                  textarea
                />
                <Field
                  label="Hypotheses generales"
                  value={caseFile.assumptions}
                  onChange={(value) => patchCaseFile("assumptions", value)}
                  placeholder="Ex. justificatifs attendus, donnees manquantes, convention applicable..."
                  textarea
                />
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              title="Lignes EVP"
              right={
                <button
                  type="button"
                  onClick={addLine}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle ligne
                </button>
              }
            />
            <PanelBody>
              <div className="space-y-3">
                {lines.map((line) => {
                  const analysis = inferLineState(line);
                  const selected = line.id === selectedLineId;

                  return (
                    <button
                      key={line.id}
                      type="button"
                      onClick={() => setSelectedLineId(line.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-900 hover:border-slate-400"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="text-xs font-medium uppercase tracking-wide opacity-70">{line.id}</div>
                          <div className="text-base font-semibold">
                            {line.employee.trim() || "Salarie a preciser"}
                          </div>
                          <div className={`text-sm ${selected ? "text-slate-200" : "text-slate-600"}`}>
                            {lineSummaryLabel(line)}
                          </div>
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${
                            selected
                              ? "border-white/20 bg-white/10 text-white"
                              : statusClasses(analysis.status)
                          }`}
                        >
                          {analysis.status}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className={`flex items-center justify-between text-xs ${selected ? "text-slate-200" : "text-slate-500"}`}>
                          <span>{line.flow ? FLOWS[line.flow].title : "Parcours a choisir"}</span>
                          <span>{analysis.progress}%</span>
                        </div>
                        <ProgressBar value={analysis.progress} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              title={selectedLine ? `Traitement ${selectedLine.id}` : "Traitement"}
              right={
                selectedLine ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={changeSelectedFlow}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Changer de parcours
                    </button>
                    <button
                      type="button"
                      onClick={resetSelectedLine}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Recommencer la ligne
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLine(selectedLine.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  </div>
                ) : null
              }
            />
            <PanelBody>
              {!selectedLine || !selectedLineState ? (
                <p className="text-sm text-slate-500">Aucune ligne selectionnee.</p>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Salarie"
                      value={selectedLine.employee}
                      onChange={(value) =>
                        patchLine(selectedLine.id, (line) => ({
                          ...line,
                          employee: value,
                        }))
                      }
                      placeholder="Ex. Salarie A"
                    />
                    <Field
                      label="Periode de ligne"
                      value={selectedLine.period}
                      onChange={(value) =>
                        patchLine(selectedLine.id, (line) => ({
                          ...line,
                          period: value,
                        }))
                      }
                      placeholder={caseFile.period || "Ex. Mars 2025"}
                    />
                  </div>

                  <Field
                    label="Intitule libre de la ligne"
                    value={selectedLine.label}
                    onChange={(value) =>
                      patchLine(selectedLine.id, (line) => ({
                        ...line,
                        label: value,
                      }))
                    }
                    placeholder="Ex. HS mars / arret maladie / prime exceptionnelle"
                  />

                  {!selectedLine.flow ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Etape 1</p>
                        <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                          Choisir le parcours de qualification pour cette ligne
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">
                          L assistant reste present, mais il travaille maintenant a l interieur d une ligne EVP.
                        </p>
                      </div>
                      <FlowPicker onSelect={chooseFlow} />
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Parcours actif</p>
                            <p className="mt-1 text-lg font-semibold text-slate-900">
                              {selectedLineState.flowConfig?.title}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {selectedLineState.flowConfig?.desc}
                            </p>
                          </div>
                          <div className="w-32">
                            <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
                              <span>Progression</span>
                              <span>{selectedLineState.progress}%</span>
                            </div>
                            <ProgressBar value={selectedLineState.progress} />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            patchLine(selectedLine.id, (line) => ({
                              ...line,
                              step: Math.max(0, line.step - 1),
                            }))
                          }
                          disabled={selectedLine.step === 0}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Retour
                        </button>

                        {selectedLineState.result && (
                          <button
                            type="button"
                            onClick={copyCaseSummary}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Copy className="h-4 w-4" />
                            {copied ? "Synthese dossier copiee" : "Copier la synthese dossier"}
                          </button>
                        )}
                      </div>

                      {selectedLineState.currentQuestion ? (
                        <QuestionBlock
                          question={selectedLineState.currentQuestion}
                          step={Math.min(selectedLine.step, selectedLineState.visibleQuestions.length)}
                          total={selectedLineState.visibleQuestions.length}
                          value={selectedLine.answers[selectedLineState.currentQuestion.id] || ""}
                          onChange={(value) => updateSelectedAnswer(selectedLineState.currentQuestion!.id, value)}
                          onNext={() =>
                            patchLine(selectedLine.id, (line) => ({
                              ...line,
                              step: Math.min(
                                line.step + 1,
                                selectedLineState.visibleQuestions.length,
                              ),
                            }))
                          }
                          canNext={Boolean(
                            String(selectedLine.answers[selectedLineState.currentQuestion.id] ?? "").trim(),
                          )}
                        />
                      ) : selectedLineState.result ? (
                        <ResultBlock result={selectedLineState.result} />
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </PanelBody>
          </Panel>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel>
            <PanelHeader
              title="Synthese du dossier"
              right={
                <button
                  type="button"
                  onClick={copyCaseSummary}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Synthese copiee" : "Copier la synthese"}
                </button>
              }
            />
            <PanelBody>
              <div className="rounded-2xl bg-slate-50 p-4">
                <pre className="whitespace-pre-wrap text-xs leading-6 text-slate-700">{caseSummaryText}</pre>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Pourquoi cette V2 ?" />
            <PanelBody>
              <div className="space-y-3 text-sm text-slate-700">
                <p>
                  Le prototype n est plus structure comme un simple questionnaire. Il devient un poste de
                  travail dossier avec plusieurs lignes EVP.
                </p>
                <p>
                  Le moteur actuel reste utile pour qualifier une ligne, mais la vue globale permet enfin de
                  piloter un cas multi-EVP comme l exercice VI.A.
                </p>
                <div className="rounded-2xl bg-slate-100 p-4">
                  <div className="flex items-start gap-2">
                    <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" />
                    <p>
                      Le prochain lot devra ajouter la vraie logique de decoupage automatique, les pieces
                      justificatives et les controles transverses entre lignes.
                    </p>
                  </div>
                </div>
                {summary.mainVigilances.length > 0 && (
                  <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                    <p className="mb-2 text-sm font-semibold text-orange-900">Vigilances transverses</p>
                    <ul className="space-y-2 text-sm text-orange-900">
                      {summary.mainVigilances.map((item) => (
                        <li key={item} className="flex gap-2">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </main>
  );
}
