export type FlowType = "temps" | "absence" | "versement" | "frais" | "sortie" | "autre" | null;
export type YesPartialNo = "Oui" | "Partiellement" | "Non";
export type Option = { value: string; label: string };
export type Answers = Record<string, string>;

export type Question = {
  id: string;
  label: string;
  type: "choice" | "text" | "number";
  options?: Option[];
  placeholder?: string;
  showIf?: (answers: Answers) => boolean;
};

export type Result = {
  qualification: string;
  traitement: string;
  bulletin: string;
  technique: YesPartialNo;
  securisee: YesPartialNo;
  vigilance: string[];
  prochaineAction: string;
};

export type FlowConfig = {
  title: string;
  desc: string;
  questions: Question[];
  infer: (answers: Answers) => Result;
};

export const OPTIONS = {
  statut: [
    { value: "non_cadre_tp", label: "Non-cadre temps plein" },
    { value: "non_cadre_tpart", label: "Non-cadre temps partiel" },
    { value: "cadre_horaire", label: "Cadre horaire décompté" },
    { value: "cadre_forfait_jours", label: "Cadre forfait jours" },
    { value: "cadre_dirigeant", label: "Cadre dirigeant" },
    { value: "inconnu", label: "À préciser" },
  ] satisfies Option[],
  ouiPartielNon: [
    { value: "oui", label: "Oui" },
    { value: "partiel", label: "Partiellement" },
    { value: "non", label: "Non" },
  ] satisfies Option[],
  ouiNon: [
    { value: "oui", label: "Oui" },
    { value: "non", label: "Non" },
  ] satisfies Option[],
};

export function v(list: Array<string | false | null | undefined>) {
  return list.filter(Boolean) as string[];
}

export function labelOf(options: Option[] | undefined, value: string) {
  return options?.find((opt) => opt.value === value)?.label ?? value;
}

function isOui(value?: string) {
  return value === "oui";
}

function isPartiel(value?: string) {
  return value === "partiel";
}

function isNon(value?: string) {
  return value === "non";
}

function techFromChecks(...checks: boolean[]): YesPartialNo {
  return checks.every(Boolean) ? "Oui" : checks.some(Boolean) ? "Partiellement" : "Non";
}

function secureFromChecks(...checks: boolean[]): YesPartialNo {
  return checks.every(Boolean) ? "Oui" : checks.some(Boolean) ? "Partiellement" : "Non";
}

function addIfMissing(label: string, value?: string) {
  return value === "oui" ? false : label;
}

function clampSecurity(result: Result): Result {
  const rank: Record<YesPartialNo, number> = {
    Non: 0,
    Partiellement: 1,
    Oui: 2,
  };

  if (rank[result.securisee] <= rank[result.technique]) {
    return result;
  }

  return {
    ...result,
    securisee: result.technique,
    vigilance: v([
      ...result.vigilance,
      "La réponse sécurisée a été plafonnée au niveau de maturité technique disponible.",
    ]),
  };
}

function inferTemps(a: Answers): Result {
  const statut = a.statut;
  const evenement = a.evenement_temps;
  const source = a.source_temps;
  const validation = a.validation_manager;
  const regle = a.regle_connue_temps;
  const heures = a.nb_heures || "à préciser";
  const description = a.description_temps;
  const natureHeures = a.nature_heures;
  const baseConnue = a.base_temps_connue;

  const sourceOk = isOui(source);
  const validationOk = isOui(validation);
  const regleOk = isOui(regle);
  const baseOk = isOui(baseConnue);

  if (evenement === "heures_en_plus") {
    if (statut === "non_cadre_tpart") {
      return {
        qualification:
          "Heures en plus sur contrat à temps partiel : priorité à la qualification en heures complémentaires avant toute valorisation.",
        traitement:
          `Contrôler le contrat de travail, les limites contractuelles, les seuils applicables et la nature des heures déclarées (${heures} heure(s)).`,
        bulletin: "Brut probable, mais rubrique à confirmer après qualification HC / HS.",
        technique: techFromChecks(sourceOk, validationOk),
        securisee: secureFromChecks(sourceOk, validationOk, regleOk, baseOk),
        vigilance: v([
          "Ne pas conclure trop vite à des heures supplémentaires.",
          addIfMissing("Source horaire insuffisamment sécurisée.", source),
          addIfMissing("Validation du temps à sécuriser.", validation),
          addIfMissing("Règle applicable à confirmer.", regle),
          addIfMissing("Base de comparaison / horaire contractuel à confirmer.", baseConnue),
          !natureHeures && "Préciser s'il s'agit d'heures régulières, exceptionnelles ou structurelles.",
        ]),
        prochaineAction: "Vérifier la qualification HC/HS",
      };
    }

    if (statut === "cadre_forfait_jours" || statut === "cadre_dirigeant") {
      return {
        qualification:
          "Dépassement horaire déclaré sur un statut pouvant exclure ou modifier le régime habituel des heures supplémentaires.",
        traitement:
          "Ne pas calculer immédiatement. Vérifier le régime réel du salarié, la convention de forfait, la nature du dépassement et la règle applicable.",
        bulletin: "Indéterminé tant que la qualification n'est pas stabilisée.",
        technique: techFromChecks(sourceOk, validationOk),
        securisee: secureFromChecks(sourceOk, validationOk, regleOk),
        vigilance: v([
          "Le statut salarié impacte directement le traitement.",
          "Le mot 'cadre' ne suffit pas seul.",
          addIfMissing("Source horaire insuffisamment sécurisée.", source),
          addIfMissing("Validation du temps à sécuriser.", validation),
          addIfMissing("Règle applicable à confirmer.", regle),
        ]),
        prochaineAction: "Vérifier le régime salarié",
      };
    }

    if (natureHeures === "structurelles") {
      return {
        qualification: "Heures structurelles / récurrentes probables.",
        traitement:
          `Vérifier si ces heures relèvent d'une organisation habituelle du temps de travail avant calcul. Volume déclaré : ${heures} heure(s).`,
        bulletin: "Brut, mais traitement à confirmer selon caractère structurel ou exceptionnel.",
        technique: techFromChecks(sourceOk, validationOk, baseOk),
        securisee: secureFromChecks(sourceOk, validationOk, regleOk, baseOk),
        vigilance: v([
          "Vérifier si le volume d'heures est habituel et déjà intégré au schéma de paie.",
          addIfMissing("Base de comparaison / horaire de référence à confirmer.", baseConnue),
          addIfMissing("Règle de majoration à confirmer.", regle),
        ]),
        prochaineAction: "Qualifier le caractère structurel des heures",
      };
    }

    return {
      qualification: "Heures supplémentaires probables sur régime horaire classique.",
      traitement:
        `Calculer les heures avec majorations applicables après contrôle de la source, de la validation et de la base de comparaison. Volume déclaré : ${heures} heure(s).`,
      bulletin: "Brut, rubrique heures supplémentaires / temps additionnel selon le paramétrage.",
      technique: techFromChecks(sourceOk, validationOk, baseOk),
      securisee: secureFromChecks(sourceOk, validationOk, regleOk, baseOk),
      vigilance: v([
        addIfMissing("Vérifier GTA / relevé / planning.", source),
        addIfMissing("Validation manager à sécuriser.", validation),
        addIfMissing("Majoration / règle applicable à confirmer.", regle),
        addIfMissing("Base de comparaison / temps de référence à confirmer.", baseConnue),
      ]),
      prochaineAction:
        sourceOk && validationOk && baseOk
          ? "Calculer les HS avec majorations"
          : "Demander la pièce horaire",
    };
  }

  if (evenement === "presence") {
    if (description?.toLowerCase().includes("trajet")) {
      return {
        qualification: "Temps de trajet ou temps périphérique à qualifier.",
        traitement:
          "Vérifier si le temps constaté relève du travail effectif, d'une contrepartie spécifique ou d'un simple suivi.",
        bulletin: "À déterminer selon la qualification finale.",
        technique: sourceOk ? "Partiellement" : "Non",
        securisee: secureFromChecks(sourceOk, regleOk),
        vigilance: v([
          "Le temps de trajet ne se traite pas automatiquement comme du temps de travail effectif.",
          addIfMissing("Source ou validation à sécuriser.", source),
          addIfMissing("Règle de traitement à confirmer.", regle),
        ]),
        prochaineAction: "Qualifier le temps de trajet",
      };
    }

    return {
      qualification: "Temps de présence / assimilation à qualifier.",
      traitement:
        "Vérifier si le temps déclaré est du temps de travail effectif, un temps assimilé, un temps indemnisé ou un simple élément de suivi.",
      bulletin: "À déterminer selon la qualification finale du temps.",
      technique: sourceOk ? "Partiellement" : "Non",
      securisee: secureFromChecks(sourceOk, regleOk),
      vigilance: v([
        description ? `Temps déclaré : ${description}.` : "Nature exacte du temps à préciser.",
        "Ne pas assimiler automatiquement ce temps à des heures supplémentaires.",
        addIfMissing("Source ou validation à sécuriser.", source),
        addIfMissing("Règle de traitement à confirmer.", regle),
      ]),
      prochaineAction: "Qualifier le temps",
    };
  }

  if (evenement === "astreinte") {
    return {
      qualification: "Astreinte / intervention à distinguer du temps de travail effectif.",
      traitement:
        `Séparer la période d'astreinte, l'éventuelle indemnisation et les éventuelles heures d'intervention. Volume déclaré : ${heures} heure(s).`,
      bulletin: "Indemnité d'astreinte, heures d'intervention ou mixte selon le cas.",
      technique: sourceOk ? "Partiellement" : "Non",
      securisee: secureFromChecks(sourceOk, validationOk, regleOk),
      vigilance: v([
        "Ne pas traiter toute l'astreinte comme du temps de travail.",
        addIfMissing("Validation des interventions à confirmer.", validation),
        addIfMissing("Règle d'indemnisation / rémunération à confirmer.", regle),
      ]),
      prochaineAction: "Distinguer astreinte et intervention",
    };
  }

  return {
    qualification: "Temps atypique à qualifier.",
    traitement: "Stabiliser la nature du temps avant tout calcul ou intégration en paie.",
    bulletin: "À déterminer.",
    technique: sourceOk ? "Partiellement" : "Non",
    securisee: "Non",
    vigilance: v([
      description ? `Description fournie : ${description}.` : "Description du temps insuffisante.",
      addIfMissing("Source ou validation à sécuriser.", source),
      addIfMissing("Règle applicable à confirmer.", regle),
    ]),
    prochaineAction: "Corriger la qualification",
  };
}

function inferAbsence(a: Answers): Result {
  const type = a.type_absence;
  const justif = a.justificatif_absence;
  const unite = a.unite_absence;
  const anciennete = a.anciennete;
  const ijss = a.ijss;
  const droitsCp = a.droits_cp;
  const maintien = a.regle_maintien_connue;
  const dureeAbsence = a.duree_absence;

  const justifOk = isOui(justif);
  const uniteConnue = unite !== "inconnu";
  const ijssOk = !isNon(ijss);
  const droitsCpOk = isOui(droitsCp);
  const maintienOk = isOui(maintien);

  if (type === "maladie") {
    return {
      qualification: "Arrêt maladie probable.",
      traitement:
        "Calculer la retenue d'absence selon l'unité retenue, puis contrôler le maintien de salaire, les IJSS, la subrogation éventuelle et les régularisations.",
      bulletin: "Mixte : retenue d'absence + maintien éventuel + IJSS éventuelles.",
      technique: techFromChecks(uniteConnue),
      securisee: secureFromChecks(justifOk, uniteConnue, ijssOk, maintienOk),
      vigilance: v([
        "Raisonner dans l'ordre : retenue absence, IJSS, subrogation éventuelle, maintien employeur.",
        addIfMissing("Justificatif ou validation d'absence incomplet(e).", justif),
        !uniteConnue && "L'unité de décompte n'est pas sécurisée.",
        anciennete && `Ancienneté à confronter à la règle de maintien : ${anciennete}.`,
        addIfMissing("Traitement IJSS / subrogation à confirmer.", ijss),
        addIfMissing("Règle de maintien de salaire à confirmer.", maintien),
        dureeAbsence && `Durée déclarée : ${dureeAbsence}.`,
      ]),
      prochaineAction: "Contrôler le maintien de salaire",
    };
  }

  if (type === "cp") {
    return {
      qualification: "Congés payés.",
      traitement: "Vérifier les droits disponibles, le mode de décompte et l'indemnisation applicable.",
      bulletin: "Absence rémunérée / rubrique congés payés.",
      technique: techFromChecks(droitsCpOk, uniteConnue),
      securisee: secureFromChecks(droitsCpOk, uniteConnue),
      vigilance: v([
        addIfMissing("Droits / compteurs de congés à confirmer.", droitsCp),
        !uniteConnue && "Préciser jours ouvrés / ouvrables / calendaires / heures.",
      ]),
      prochaineAction: "Contrôler les droits et le décompte",
    };
  }

  if (type === "sans_solde") {
    return {
      qualification: "Absence non rémunérée / congé sans solde.",
      traitement: "Appliquer la méthode de retenue prévue par la règle du cas ou de l'entreprise.",
      bulletin: "Retenue sur brut / absence non rémunérée.",
      technique: techFromChecks(uniteConnue),
      securisee: secureFromChecks(justifOk, uniteConnue),
      vigilance: v([
        addIfMissing("Validation d'absence à sécuriser.", justif),
        !uniteConnue && "Unité de décompte à confirmer.",
      ]),
      prochaineAction:
        justifOk ? "Valider la retenue d'absence" : "Demander le justificatif ou la validation",
    };
  }

  if (type === "familial") {
    return {
      qualification: "Événement familial / absence potentiellement rémunérée.",
      traitement:
        "Vérifier le motif exact, la convention applicable, la durée autorisée et les justificatifs.",
      bulletin: "Selon règle : absence rémunérée ou non, à confirmer.",
      technique: "Partiellement",
      securisee: justifOk ? "Partiellement" : "Non",
      vigilance: v([
        "Le régime dépend du motif exact et de la règle applicable.",
        addIfMissing("Justificatif à sécuriser.", justif),
        !uniteConnue && "Unité de décompte à confirmer.",
      ]),
      prochaineAction: "Contrôler la règle applicable",
    };
  }

  if (type === "injustifiee") {
    return {
      qualification: "Absence injustifiée probable.",
      traitement:
        "Traiter en retenue d'absence après confirmation RH / manager et traçabilité du défaut de justificatif.",
      bulletin: "Retenue d'absence non rémunérée.",
      technique: techFromChecks(uniteConnue),
      securisee: isNon(justif) && uniteConnue ? "Partiellement" : "Non",
      vigilance: [
        "Bien distinguer absence injustifiée et justificatif simplement non reçu à date.",
        "Sécuriser la validation RH / manager avant conclusion définitive.",
      ],
      prochaineAction: "Sécuriser la qualification RH",
    };
  }

  return {
    qualification: "Absence à qualifier plus précisément.",
    traitement: "Vérifier le motif, le justificatif, la rémunération associée et l'unité de décompte.",
    bulletin: "À déterminer.",
    technique: "Partiellement",
    securisee: "Non",
    vigilance: ["Le motif exact de l'absence n'est pas encore stabilisé."],
    prochaineAction: "Corriger la qualification",
  };
}

function inferVersement(a: Answers): Result {
  const nature = a.nature_versement;
  const support = a.support_versement;
  const montant = a.montant || "à préciser";
  const periode = a.periode_versement;
  const description = a.description_versement;
  const recurrence = a.versement_recurrent;

  const supportOk = isOui(support);
  const periodeOk = isOui(periode);
  const recurrenceOk = isOui(recurrence);

  if (nature === "non_qualifie") {
    return {
      qualification: "Versement non qualifié : la nature de l'EVP n'est pas stabilisée.",
      traitement:
        `Ne pas intégrer directement les ${montant} € avant qualification claire du versement (prime, acompte, avance, rappel, remboursement...).`,
      bulletin: "Indéterminé tant que la nature n'est pas qualifiée.",
      technique: "Partiellement",
      securisee: "Non",
      vigilance: v([
        description ? `Description fournie : ${description}.` : "Description du versement insuffisante.",
        "Le support du versement doit être vérifié avant tout traitement.",
      ]),
      prochaineAction: "Corriger la qualification",
    };
  }

  if (nature === "prime") {
    return {
      qualification: "Prime / versement complémentaire de rémunération.",
      traitement:
        `Intégrer le montant de ${montant} € après vérification du support, de la période de rattachement, de la validation et du caractère ponctuel ou récurrent.`,
      bulletin: "Brut, rubrique prime.",
      technique: techFromChecks(supportOk),
      securisee: secureFromChecks(supportOk, periodeOk),
      vigilance: v([
        addIfMissing("Support / validation de prime à sécuriser.", support),
        addIfMissing("Période de rattachement à confirmer.", periode),
        recurrenceOk && "Vérifier si la prime récurrente relève d'un usage ou d'une règle permanente.",
      ]),
      prochaineAction: supportOk ? "Valider l'intégration de la prime" : "Demander le support de prime",
    };
  }

  if (nature === "rappel") {
    return {
      qualification: "Rappel de salaire probable.",
      traitement:
        `Identifier l'origine du rappel, la période concernée et la correction attendue avant intégration de ${montant} €.`,
      bulletin: "Brut, ligne de rappel / régularisation selon paramétrage.",
      technique: supportOk ? "Partiellement" : "Non",
      securisee: secureFromChecks(supportOk, periodeOk),
      vigilance: v([
        "Ne pas traiter un rappel comme une prime générique.",
        addIfMissing("Période d'origine à confirmer.", periode),
        addIfMissing("Support de régularisation à sécuriser.", support),
      ]),
      prochaineAction: "Qualifier l'origine du rappel",
    };
  }

  if (nature === "acompte") {
    return {
      qualification: "Acompte sur salaire.",
      traitement:
        `Traiter comme versement d'une rémunération déjà acquise ; ne pas le traiter comme une prime. Montant : ${montant} €.`,
      bulletin: "Mouvement de paiement / régularisation, pas une rémunération nouvelle.",
      technique: "Oui",
      securisee: supportOk ? "Oui" : "Partiellement",
      vigilance: v([addIfMissing("Vérifier la demande / validation de l'acompte.", support)]),
      prochaineAction: "Valider le traitement d'acompte",
    };
  }

  return {
    qualification: "Avance sur salaire probable.",
    traitement:
      `Traiter comme avance puis régularisation, sans créer une rémunération nouvelle. Montant : ${montant} €.`,
    bulletin: "Avance / régularisation.",
    technique: "Oui",
    securisee: supportOk ? "Oui" : "Partiellement",
    vigilance: v([
      "Bien distinguer avance et acompte.",
      addIfMissing("Support à sécuriser.", support),
    ]),
    prochaineAction: "Valider le traitement d'avance",
  };
}

function inferFrais(a: Answers): Result {
  const justif = a.justificatif_frais;
  const montant = a.montant || "à préciser";
  const typeFrais = a.type_frais;
  const bareme = a.bareme_regle;
  const recurrent = a.frais_recurrents;
  const modeFrais = a.mode_frais;

  const justifOk = isOui(justif);
  const baremeOk = isOui(bareme);

  if (typeFrais === "ik") {
    return {
      qualification: "Indemnités kilométriques.",
      traitement:
        `Contrôler le kilométrage, le véhicule, le barème applicable et les justificatifs avant remboursement de ${montant} €.`,
      bulletin: "Net / remboursement ou indemnité selon paramétrage.",
      technique: techFromChecks(justifOk, baremeOk),
      securisee: secureFromChecks(justifOk, baremeOk),
      vigilance: v([
        addIfMissing("Pièces justificatives ou détails kilométriques incomplets.", justif),
        addIfMissing("Barème applicable à confirmer.", bareme),
      ]),
      prochaineAction: "Contrôler le barème IK",
    };
  }

  if (typeFrais === "transport") {
    return {
      qualification: "Participation transport / remboursement de transport.",
      traitement:
        `Vérifier la nature du transport, les justificatifs et la part prise en charge avant intégration de ${montant} €.`,
      bulletin: "Net / remboursement transport selon paramétrage.",
      technique: justifOk ? "Oui" : "Partiellement",
      securisee: justifOk && !isNon(bareme) ? "Oui" : "Partiellement",
      vigilance: v([
        addIfMissing("Justificatif transport à sécuriser.", justif),
        recurrent === "oui" && "Vérifier la récurrence et l'actualisation des justificatifs.",
      ]),
      prochaineAction: "Valider la prise en charge transport",
    };
  }

  if (typeFrais === "teletravail") {
    return {
      qualification: "Indemnité / allocation télétravail probable.",
      traitement:
        `Vérifier la règle interne / conventionnelle, la fréquence et le caractère forfaitaire ou réel avant versement de ${montant} €.`,
      bulletin: "Net / indemnité télétravail selon paramétrage.",
      technique: baremeOk ? "Oui" : "Partiellement",
      securisee: secureFromChecks(!isNon(justif), baremeOk),
      vigilance: v([
        "Vérifier si le versement repose sur une règle forfaitaire interne ou sur justificatifs.",
        recurrent === "oui" && "Sécuriser la base de calcul récurrente.",
        modeFrais === "forfaitaire" && "Vérifier le plafond et la règle du forfait télétravail.",
        addIfMissing("Justificatifs ou support d'attribution à confirmer.", justif),
        addIfMissing("Règle / plafond applicable à confirmer.", bareme),
      ]),
      prochaineAction: "Contrôler la règle télétravail",
    };
  }

  if (typeFrais === "forfait") {
    return {
      qualification: "Allocation / forfait à sécuriser.",
      traitement:
        `Vérifier la base juridique, le plafond, la périodicité et le risque de requalification avant versement de ${montant} €.`,
      bulletin: "Net ou brut selon régime, à confirmer.",
      technique: "Partiellement",
      securisee: justifOk && baremeOk ? "Partiellement" : "Non",
      vigilance: v([
        "Un forfait mal documenté peut être requalifié.",
        addIfMissing("Justificatifs ou éléments de calcul insuffisants.", justif),
        addIfMissing("Plafond / règle applicable à confirmer.", bareme),
      ]),
      prochaineAction: "Sécuriser le régime du forfait",
    };
  }

  return {
    qualification: "Frais / remboursement de frais.",
    traitement:
      `Vérifier la nature des dépenses puis intégrer le remboursement de ${montant} € selon le régime applicable.`,
    bulletin: "Net / remboursement / indemnité selon le paramétrage et la nature.",
    technique: isNon(justif) ? "Partiellement" : "Oui",
    securisee: justifOk && baremeOk ? "Oui" : isPartiel(justif) ? "Partiellement" : "Non",
    vigilance: v([
      addIfMissing("Sans justificatif complet, risque de requalification ou de traitement non sécurisé.", justif),
      addIfMissing("Règle / barème à confirmer.", bareme),
    ]),
    prochaineAction: justifOk ? "Valider le remboursement" : "Demander les justificatifs",
  };
}

function inferSortie(a: Answers): Result {
  const docs = a.docs_sortie;
  const typeSortie = a.type_sortie;
  const dateSortie = a.date_sortie_connue;
  const cp = a.cp_soldes_connus;
  const baseJuridique = a.base_juridique_sortie;

  const docsOk = isOui(docs);
  const dateOk = isOui(dateSortie);
  const cpOk = isOui(cp);
  const baseJuridiqueOk = isOui(baseJuridique);

  if (typeSortie === "iccp") {
    return {
      qualification: "Indemnité compensatrice de congés payés.",
      traitement:
        "Contrôler les soldes de congés, la méthode de calcul et les compteurs à solder avant intégration.",
      bulletin: "Rubrique de sortie ICCP.",
      technique: cpOk ? "Oui" : "Partiellement",
      securisee: secureFromChecks(docsOk, dateOk, cpOk),
      vigilance: v([
        addIfMissing("Soldes de congés / compteurs à confirmer.", cp),
        addIfMissing("Documents de sortie à sécuriser.", docs),
        addIfMissing("Date de sortie effective à confirmer.", dateSortie),
      ]),
      prochaineAction: "Contrôler les soldes de congés",
    };
  }

  if (typeSortie === "preavis") {
    return {
      qualification: "Indemnité de préavis.",
      traitement:
        "Vérifier si le préavis est exécuté, dispensé ou indemnisé et appliquer le traitement correspondant.",
      bulletin: "Rubrique indemnité / préavis selon le cas.",
      technique: docsOk ? "Oui" : "Partiellement",
      securisee: secureFromChecks(docsOk, dateOk, baseJuridiqueOk),
      vigilance: v([
        "Bien distinguer préavis travaillé et préavis indemnisé.",
        addIfMissing("Base juridique / notification à confirmer.", baseJuridique),
        addIfMissing("Date de fin de contrat à sécuriser.", dateSortie),
      ]),
      prochaineAction: "Qualifier le régime du préavis",
    };
  }

  if (typeSortie === "rupture") {
    return {
      qualification: "Indemnité de rupture.",
      traitement:
        "Qualifier précisément le type de rupture puis vérifier le régime social et fiscal propre à l'indemnité.",
      bulletin: "Rubrique indemnité de rupture à identifier.",
      technique: docsOk ? "Partiellement" : "Non",
      securisee: secureFromChecks(docsOk, dateOk, baseJuridiqueOk),
      vigilance: v([
        "Le régime dépend du motif et du cadre juridique de rupture.",
        addIfMissing("Documents / base juridique à confirmer.", docs),
        addIfMissing("Base juridique de rupture à confirmer.", baseJuridique),
        addIfMissing("Date de sortie à sécuriser.", dateSortie),
      ]),
      prochaineAction: "Contrôler le régime de l'indemnité",
    };
  }

  if (typeSortie === "regul") {
    return {
      qualification: "Régularisation de sortie / solde.",
      traitement:
        "Vérifier les éléments restant dus ou à reprendre, la date de sortie et les compteurs à solder.",
      bulletin: "Rubrique de régularisation de sortie à identifier.",
      technique: docsOk ? "Partiellement" : "Non",
      securisee: docsOk && dateOk && !isNon(cp) ? "Partiellement" : "Non",
      vigilance: v([
        addIfMissing("Compteurs / soldes à confirmer.", cp),
        addIfMissing("Documents de sortie incomplets.", docs),
        addIfMissing("Date de sortie à confirmer.", dateSortie),
      ]),
      prochaineAction: "Contrôler le solde final",
    };
  }

  return {
    qualification: "EVP de sortie / fin de contrat.",
    traitement:
      "Qualifier précisément l'élément de sortie, puis vérifier le régime social et fiscal propre à la ligne.",
    bulletin: "Rubrique de sortie spécifique à identifier.",
    technique: isNon(docs) ? "Partiellement" : "Oui",
    securisee: docsOk ? "Partiellement" : "Non",
    vigilance: v([addIfMissing("Documents de sortie / base juridique à confirmer.", docs)]),
    prochaineAction: docsOk ? "Contrôler le solde de tout compte" : "Demander les documents de sortie",
  };
}

function inferAutre(a: Answers): Result {
  return {
    qualification: "Cas atypique à qualifier.",
    traitement: "Commencer par stabiliser la nature de l'événement avant tout traitement paie.",
    bulletin:
      a.impact_pressenti === "inconnu"
        ? "À déterminer."
        : `Impact pressenti : ${a.impact_pressenti}. À confirmer après qualification.`,
    technique: isOui(a.source_autre) ? "Partiellement" : "Non",
    securisee: "Non",
    vigilance: v([
      "La qualification n'est pas stabilisée.",
      a.description_autre && `Description fournie : ${a.description_autre}.`,
    ]),
    prochaineAction: "Corriger la qualification",
  };
}

function withGuards(infer: (answers: Answers) => Result) {
  return (answers: Answers) => clampSecurity(infer(answers));
}

export const FLOWS: Record<Exclude<FlowType, null>, FlowConfig> = {
  temps: {
    title: "Temps de travail",
    desc: "HS, HC, présence, astreinte, temps assimilé.",
    questions: [
      { id: "statut", label: "Quel est le statut du salarié ?", type: "choice", options: OPTIONS.statut },
      {
        id: "evenement_temps",
        label: "Quel événement temps constates-tu ?",
        type: "choice",
        options: [
          { value: "heures_en_plus", label: "Heures en plus" },
          { value: "presence", label: "Temps de présence / assimilation" },
          { value: "astreinte", label: "Astreinte / intervention" },
          { value: "autre", label: "Autre temps atypique" },
        ],
      },
      {
        id: "source_temps",
        label: "As-tu une source exploitable (GTA, relevé, planning, validation) ?",
        type: "choice",
        options: OPTIONS.ouiPartielNon,
      },
      {
        id: "nb_heures",
        label: "Combien d'heures sont concernées ?",
        type: "number",
        placeholder: "Ex. 8",
        showIf: (a) => a.evenement_temps === "heures_en_plus" || a.evenement_temps === "astreinte",
      },
      {
        id: "nature_heures",
        label: "Quelle est la nature la plus probable de ces heures ?",
        type: "choice",
        options: [
          { value: "exceptionnelles", label: "Exceptionnelles / ponctuelles" },
          { value: "structurelles", label: "Structurelles / récurrentes" },
          { value: "inconnue", label: "À préciser" },
        ],
        showIf: (a) => a.evenement_temps === "heures_en_plus",
      },
      {
        id: "validation_manager",
        label: "Le temps a-t-il été validé ?",
        type: "choice",
        options: OPTIONS.ouiPartielNon,
        showIf: (a) => a.evenement_temps === "heures_en_plus" || a.evenement_temps === "astreinte",
      },
      {
        id: "base_temps_connue",
        label: "La base de comparaison / l'horaire de référence est-elle connue ?",
        type: "choice",
        options: OPTIONS.ouiPartielNon,
        showIf: (a) => a.evenement_temps === "heures_en_plus",
      },
      {
        id: "description_temps",
        label: "Décris brièvement le temps constaté",
        type: "text",
        placeholder: "Ex. permanence, habillage, pause, amplitude, trajet, déplacement...",
        showIf: (a) => a.evenement_temps === "presence" || a.evenement_temps === "autre",
      },
      {
        id: "regle_connue_temps",
        label: "La règle applicable est-elle connue ?",
        type: "choice",
        options: OPTIONS.ouiPartielNon,
      },
    ],
    infer: withGuards(inferTemps),
  },

  absence: {
    title: "Absence",
    desc: "Maladie, CP, sans solde, événement familial, autre.",
    questions: [
      { id: "statut", label: "Quel est le statut du salarié ?", type: "choice", options: OPTIONS.statut },
      {
        id: "type_absence",
        label: "Quel type d'absence constates-tu ?",
        type: "choice",
        options: [
          { value: "maladie", label: "Arrêt maladie" },
          { value: "cp", label: "Congés payés" },
          { value: "sans_solde", label: "Congé sans solde / absence non rémunérée" },
          { value: "familial", label: "Événement familial / absence rémunérée" },
          { value: "injustifiee", label: "Absence injustifiée" },
          { value: "autre", label: "Autre" },
        ],
      },
      {
        id: "duree_absence",
        label: "Durée de l'absence (libre)",
        type: "text",
        placeholder: "Ex. 3 jours / du 4 au 8 / 14 heures",
      },
      {
        id: "anciennete",
        label: "Ancienneté du salarié ?",
        type: "text",
        placeholder: "Ex. 2 ans / 8 mois",
        showIf: (a) => a.type_absence === "maladie",
      },
      {
        id: "justificatif_absence",
        label: "Le justificatif / la validation est-il(elle) disponible ?",
        type: "choice",
        options: OPTIONS.ouiPartielNon,
      },
      {
        id: "unite_absence",
        label: "L'unité de décompte est-elle connue ?",
        type: "choice",
        options: [
          { value: "jours_cal", label: "Jours calendaires" },
          { value: "jours_ouvres", label: "Jours ouvrés" },
          { value: "jours_ouvrables", label: "Jours ouvrables" },
          { value: "heures", label: "Heures" },
          { value: "inconnu", label: "À déterminer" },
        ],
      },
      {
        id: "ijss",
        label: "Des IJSS / une subrogation sont-elles à prendre en compte ?",
        type: "choice",
        options: OPTIONS.ouiPartielNon,
        showIf: (a) => a.type_absence === "maladie",
      },
      {
        id: "regle_maintien_connue",
        label: "La règle de maintien de salaire est-elle connue ?",
        type: "choice",
        options: OPTIONS.ouiPartielNon,
        showIf: (a) => a.type_absence === "maladie",
      },
      {
        id: "droits_cp",
        label: "Les droits / compteurs sont-ils connus ?",
        type: "choice",
        options: OPTIONS.ouiPartielNon,
        showIf: (a) => a.type_absence === "cp",
      },
    ],
    infer: withGuards(inferAbsence),
  },

  versement: {
    title: "Versement",
    desc: "Prime, acompte, avance, rappel, somme non qualifiée.",
    questions: [
      { id: "statut", label: "Quel est le statut du salarié ?", type: "choice", options: OPTIONS.statut },
      {
        id: "nature_versement",
        label: "Quelle est la nature la plus probable du versement ?",
        type: "choice",
        options: [
          { value: "prime", label: "Prime" },
          { value: "acompte", label: "Acompte" },
          { value: "avance", label: "Avance" },
          { value: "rappel", label: "Rappel de salaire" },
          { value: "non_qualifie", label: "Versement non qualifié" },
        ],
      },
      { id: "montant", label: "Montant concerné", type: "number", placeholder: "Ex. 80" },
      {
        id: "support_versement",
        label: "As-tu un support / une validation du versement ?",
        type: "choice",
        options: OPTIONS.ouiPartielNon,
      },
      {
        id: "periode_versement",
        label: "La période de rattachement est-elle connue ?",
        type: "choice",
        options: OPTIONS.ouiPartielNon,
        showIf: (a) => a.nature_versement === "prime" || a.nature_versement === "rappel",
      },
      {
        id: "versement_recurrent",
        label: "Le versement est-il récurrent ?",
        type: "choice",
        options: OPTIONS.ouiPartielNon,
        showIf: (a) => a.nature_versement === "prime",
      },
      {
        id: "description_versement",
        label: "Décris brièvement le versement",
        type: "text",
        placeholder: "Ex. prime exceptionnelle, rappel heures, versement libre...",
        showIf: (a) => a.nature_versement === "non_qualifie",
      },
    ],
    infer: withGuards(inferVersement),
  },

  frais: {
    title: "Frais / remboursement",
    desc: "IK, transport, télétravail, remboursement, forfait.",
    questions: [
      { id: "statut", label: "Quel est le statut du salarié ?", type: "choice", options: OPTIONS.statut },
      {
        id: "type_frais",
        label: "Quel type de frais / remboursement ?",
        type: "choice",
        options: [
          { value: "ik", label: "Indemnités kilométriques" },
          { value: "transport", label: "Transport" },
          { value: "teletravail", label: "Télétravail" },
          { value: "remboursement", label: "Remboursement de frais" },
          { value: "forfait", label: "Allocation / forfait" },
        ],
      },
      {
        id: "mode_frais",
        label: "Le traitement envisagé est-il au réel ou au forfait ?",
        type: "choice",
        options: [
          { value: "reel", label: "Au réel" },
          { value: "forfaitaire", label: "Forfaitaire" },
          { value: "inconnu", label: "À préciser" },
        ],
      },
      { id: "montant", label: "Montant concerné", type: "number", placeholder: "Ex. 120" },
      {
        id: "justificatif_frais",
        label: "Les justificatifs sont-ils disponibles ?",
        type: "choice",
        options: OPTIONS.ouiPartielNon,
      },
      {
        id: "bareme_regle",
        label: "Le barème / la règle applicable est-il(elle) connu(e) ?",
        type: "choice",
        options: OPTIONS.ouiPartielNon,
      },
      {
        id: "frais_recurrents",
        label: "S'agit-il d'un versement récurrent ?",
        type: "choice",
        options: OPTIONS.ouiNon,
      },
    ],
    infer: withGuards(inferFrais),
  },

  sortie: {
    title: "Fin de contrat",
    desc: "ICCP, préavis, indemnité de rupture, régularisation.",
    questions: [
      { id: "statut", label: "Quel est le statut du salarié ?", type: "choice", options: OPTIONS.statut },
      {
        id: "type_sortie",
        label: "Quel élément de sortie ?",
        type: "choice",
        options: [
          { value: "iccp", label: "Indemnité compensatrice de congés payés" },
          { value: "preavis", label: "Indemnité de préavis" },
          { value: "rupture", label: "Indemnité de rupture" },
          { value: "regul", label: "Régularisation de sortie / solde" },
          { value: "autre", label: "Autre" },
        ],
      },
      {
        id: "docs_sortie",
        label: "Les documents de sortie et la règle applicable sont-ils disponibles ?",
        type: "choice",
        options: OPTIONS.ouiPartielNon,
      },
      {
        id: "base_juridique_sortie",
        label: "La base juridique du traitement de sortie est-elle connue ?",
        type: "choice",
        options: OPTIONS.ouiPartielNon,
        showIf: (a) => a.type_sortie === "preavis" || a.type_sortie === "rupture",
      },
      {
        id: "date_sortie_connue",
        label: "La date de sortie effective est-elle sécurisée ?",
        type: "choice",
        options: OPTIONS.ouiPartielNon,
      },
      {
        id: "cp_soldes_connus",
        label: "Les soldes de congés / compteurs sont-ils connus ?",
        type: "choice",
        options: OPTIONS.ouiPartielNon,
        showIf: (a) => a.type_sortie === "iccp" || a.type_sortie === "regul",
      },
    ],
    infer: withGuards(inferSortie),
  },

  autre: {
    title: "Autre cas",
    desc: "Cas atypique à orienter et sécuriser.",
    questions: [
      { id: "statut", label: "Quel est le statut du salarié ?", type: "choice", options: OPTIONS.statut },
      {
        id: "description_autre",
        label: "Décris brièvement l'événement constaté",
        type: "text",
        placeholder: "Ex. avantage, retenue atypique, correction, EVP ambigu...",
      },
      {
        id: "source_autre",
        label: "As-tu une source exploitable ?",
        type: "choice",
        options: OPTIONS.ouiPartielNon,
      },
      {
        id: "impact_pressenti",
        label: "Quel impact bulletin pressens-tu ?",
        type: "choice",
        options: [
          { value: "brut", label: "Brut" },
          { value: "retenue", label: "Retenue" },
          { value: "net", label: "Net" },
          { value: "information", label: "Information bulletin" },
          { value: "inconnu", label: "À déterminer" },
        ],
      },
    ],
    infer: withGuards(inferAutre),
  },
};
