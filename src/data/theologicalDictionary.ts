export interface TheologicalConcept {
  term: string;
  aliases: string[];
  originalWord: string;
  languageOrigin: 'Grec' | 'Hébreu' | 'Grec / Hébreu';
  definition: string;
  theologicalMeaning: string;
  biblicalContext: string;
  keyVerses: Array<{ reference: string; text: string }>;
  spiritualApplication: string;
}

export const THEOLOGICAL_DICTIONARY: Record<string, TheologicalConcept> = {
  sanctification: {
    term: "Sanctification",
    aliases: ["sanctification", "sanctifier", "sainteté", "saint", "saints", "hagiasmos", "qodesh"],
    originalWord: "Hébreu : קֹדֶשׁ (Qadosh / Qodesh) — Grec : ἁγιασμός (Hagiasmos)",
    languageOrigin: "Grec / Hébreu",
    definition: "Acte par lequel Dieu met à part une personne ou un objet pour Son service sacré, et processus continu par lequel le Saint-Esprit transforme le croyant à l'image du Christ en le purifiant du péché.",
    theologicalMeaning: "La sanctification est à la fois positionnelle (acquise définitivement par le sang de Jésus-Christ à la croix) et progressive (marche quotidienne d'obéissance, de mort à soi-même et de croissance spirituelle sous l'action du Saint-Esprit). Elle est indissociable de la vraie foi.",
    biblicalContext: "Dans l'Ancien Testament, Dieu ordonne à Israël : « Soyez saints, car Je suis saint » (Lévitique 11:44). Dans le Nouveau Testament, l'apôtre Paul souligne que « la volonté de Dieu, c'est votre sanctification » (1 Thessaloniciens 4:3), avertissant que sans la sanctification « personne ne verra le Seigneur » (Hébreux 12:14).",
    keyVerses: [
      { reference: "1 Thessaloniciens 4:3", text: "Ce que Dieu veut, c'est votre sanctification; c'est que vous vous absteniez de l'impudicité." },
      { reference: "Hébreux 12:14", text: "Recherchez la paix avec tous, et la sanctification, sans laquelle personne ne verra le Seigneur." },
      { reference: "1 Pierre 1:15-16", text: "Mais, puisque celui qui vous a appelés est saint, vous aussi soyez saints dans toute votre conduite, selon qu'il est écrit: Vous serez saints, car je suis saint." },
      { reference: "1 Pierre 5:10", text: "Le Dieu de toute grâce vous perfectionnera lui-même, vous affermira, vous fortifiera, vous rendra inébranlables." }
    ],
    spiritualApplication: "Pour le chrétien de la dernière heure, la sanctification implique de veiller sur ses pensées, ses paroles, ses fréquentations et sa fidélité à la Parole de Dieu dans un monde en égarement, en s'appuyant chaque jour sur la prière et la puissance de l'Esprit."
  },
  justification: {
    term: "Justification",
    aliases: ["justification", "justifier", "juste", "justice", "dikaioo", "tsedaqah"],
    originalWord: "Hébreu : צְדָקָה (Tsedaqah) — Grec : δικαίωσις (Dikaiosis) / δικαιόω (Dikaioo)",
    languageOrigin: "Grec / Hébreu",
    definition: "Déclaration légale et souveraine de Dieu par laquelle Il déclare le pécheur repentant non coupable et parfaitement juste à Ses yeux, non pas sur la base de ses propres mérites, mais par imputation de la justice parfaite de Jésus-Christ reçue par le moyen de la foi.",
    theologicalMeaning: "La justification est un acte instantané et irrévocable. Le pécheur est acquitté du châtiment de la loi parce que Christ a porté sa condamnation à la croix (Romains 3:24-26). La justice de Christ lui est attribuée comme un vêtement pur.",
    biblicalContext: "Cœur de l'épître aux Romains et aux Galates. Paul combat le légalisme des judaïsants en prouvant qu'Abraham a été justifié par la foi bien avant la loi mosaïque (Genèse 15:6 ; Romains 4:3).",
    keyVerses: [
      { reference: "Romains 5:1", text: "Étant donc justifiés par la foi, nous avons la paix avec Dieu par notre Seigneur Jésus-Christ." },
      { reference: "Romains 3:24", text: "Et ils sont gratuitement justifiés par sa grâce, par le moyen de la rédemption qui est en Jésus-Christ." },
      { reference: "Galates 2:16", text: "Sachant que ce n'est pas par les œuvres de la loi que l'homme est justifié, mais par la foi en Jésus-Christ." }
    ],
    spiritualApplication: "Savoir que l'on est justifié par la foi délivre de la culpabilité, de la peur du jugement et du légalisme, en produisant une profonde adoration et une humble reconnaissance envers le Sauveur."
  },
  grace: {
    term: "Grâce",
    aliases: ["grâce", "grace", "grâces", "charis", "chen"],
    originalWord: "Hébreu : חֵן (Chen) / חֶסֶד (Hesed) — Grec : χάρις (Charis)",
    languageOrigin: "Grec / Hébreu",
    definition: "Faveur imméritée, bienveillance souveraine et amour inconditionnel que Dieu accorde aux êtres humains indignes par le sacrifice expiatoire de Son Fils unique Jésus-Christ.",
    theologicalMeaning: "La grâce n'est pas simplement un pardon passif, mais une puissance dynamique divine qui régénère, sauve, enseigne et soutient le croyant pour vivre d'une manière sainte et agréable à Dieu (Tite 2:11-12).",
    biblicalContext: "Présente dans toute l'Écriture. La loi a été donnée par Moïse, mais la grâce et la vérité sont venues par Jésus-Christ (Jean 1:17). C'est le fondement de toute l'économie du salut.",
    keyVerses: [
      { reference: "Éphésiens 2:8-9", text: "Car c'est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c'est le don de Dieu. Non par les œuvres, afin que personne ne se glorifie." },
      { reference: "Tite 2:11-12", text: "Car la grâce de Dieu, source de salut pour tous les hommes, a été manifestée. Elle nous enseigne à renoncer à l'impiété et aux convoitises mondaines." },
      { reference: "2 Corinthiens 12:9", text: "Ma grâce te suffit, car ma puissance s'accomplit dans la faiblesse." }
    ],
    spiritualApplication: "Le croyant vit chaque jour sous le trône de la grâce, trouvant le secours nécessaire dans l'épreuve et le zèle pour témoigner de l'amour infini de Dieu."
  },
  redemption: {
    term: "Rédemption",
    aliases: ["redemption", "rédemption", "racheter", "rachat", "apolutrosis", "gaal", "padah"],
    originalWord: "Hébreu : גָּאַל (Gaal) / פָּדָה (Padah) — Grec : ἀπολύτρωσις (Apolytrosis) / ἐξαγοράζω (Exagorazo)",
    languageOrigin: "Grec / Hébreu",
    definition: "Libération et affranchissement d'un captif ou d'un esclave par le paiement complet d'un prix de rançon. Spirituellement, c'est la délivrance du pécheur de l'esclavage du péché, de la mort et de la malédiction de la loi par le sang précieux versé par Jésus-Christ.",
    theologicalMeaning: "L'humanité était captive sous la tyrannie du péché et de Satan. Jésus-Christ a payé de Sa propre vie le prix infini de notre libération, nous transférant du royaume des ténèbres dans Son admirable lumière.",
    biblicalContext: "Préfigurée dans la Pâque juive et la loi du 'Goël' (parent-rédempteur comme Boaz pour Ruth). Accomplie de manière absolue et éternelle à la croix du Calvaire.",
    keyVerses: [
      { reference: "Éphésiens 1:7", text: "En lui nous avons la rédemption par son sang, la rémission des péchés, selon la richesse de sa grâce." },
      { reference: "1 Pierre 1:18-19", text: "Ce n'est pas par des choses périssables que vous avez été rachetés, mais par le sang précieux de Christ, comme d'un agneau sans défaut et sans tache." },
      { reference: "Galates 3:13", text: "Christ nous a rachetés de la malédiction de la loi, étant devenu malédiction pour nous." }
    ],
    spiritualApplication: "Puisque nous avons été rachetés à un si grand prix, nos corps et nos esprits appartiennent désormais à Dieu, nous appelant à glorifier Dieu et refuser toute servitude du péché."
  },
  expiation: {
    term: "Expiation & Propitiation",
    aliases: ["expiation", "propitiation", "expier", "hilasterion", "kippur", "kaphar"],
    originalWord: "Hébreu : כִּפֶּר (Kaphar / Kippur) — Grec : ἱλαστήριον (Hilasterion) / ἱλασμός (Hilismos)",
    languageOrigin: "Grec / Hébreu",
    definition: "Couvrir, effacer le péché et satisfaire la sainte justice de Dieu. La propitiation détourne la sainte colère de Dieu contre le péché en offrant une victime substitutive pure.",
    theologicalMeaning: "Dieu étant saint et juste, Il ne peut ignorer le péché. À la croix, Christ a été la victime expiatoire et propitiatoire qui a pris sur Lui le jugement que nous méritions, rétablissant la paix entre Dieu et les hommes.",
    biblicalContext: "Étroitement lié au Jour des Expiations (Yom Kippour, Lévitique 16) et au propitiatoire qui recouvrait l'Arche de l'Alliance arrosé du sang sacrificiel. Hébreux 9 montre que Christ est entré une fois pour toutes dans le sanctuaire céleste.",
    keyVerses: [
      { reference: "1 Jean 4:10", text: "Et cet amour consiste, non point en ce que nous avons aimé Dieu, mais en ce qu'il nous a aimés et a envoyé son Fils comme victime expiatoire pour nos péchés." },
      { reference: "Romains 3:25", text: "C'est lui que Dieu a destiné, par son sang, à être, pour ceux qui croiraient, victime propitiatoire." },
      { reference: "Ésaïe 53:5", text: "Mais il était blessé pour nos péchés, brisé pour nos iniquités; le châtiment qui nous donne la paix est tombé sur lui." }
    ],
    spiritualApplication: "Comprendre l'expiation inspire une crainte respectueuse de la sainteté de Dieu et une confiance inébranlable dans la suffisance absolue du sacrifice de Golgotha."
  },
  foi: {
    term: "Foi",
    aliases: ["foi", "croire", "croyant", "pistis", "emunah"],
    originalWord: "Hébreu : אֱמוּנָה (Emunah) — Grec : πίστις (Pistis)",
    languageOrigin: "Grec / Hébreu",
    definition: "Confiance absolue, assurance inébranlable et abandon confiant du cœur et de la volonté envers Dieu, fondés sur la vérité immuable de Sa Parole et sur l'œuvre accomplie de Jésus-Christ.",
    theologicalMeaning: "La foi chrétienne n'est ni une pensée positive ni une adhésion intellectuelle froide : elle est un don de Dieu produit par l'écoute de la Parole (Romains 10:17), qui engendre une obéissance pratique et active (Jacques 2:17).",
    biblicalContext: "Hébreux 11 est le mémorial de la foi des patriarches, prophètes et apôtres. C'est l'instrument unique par lequel l'homme reçoit le salut et plaît au Créateur.",
    keyVerses: [
      { reference: "Hébreux 11:1", text: "Or la foi est une ferme assurance des choses qu'on espère, une démonstration de celles qu'on ne voit pas." },
      { reference: "Hébreux 11:6", text: "Or sans la foi il est impossible de lui être agréable; car il faut que celui qui s'approche de Dieu croie que Dieu existe, et qu'il est le rémunérateur de ceux qui le cherchent." },
      { reference: "Romains 10:17", text: "Ainsi la foi vient de ce qu'on entend, et ce qu'on entend vient de la parole de Christ." }
    ],
    spiritualApplication: "La foi pousse le chrétien à marcher dans la fidélité, à surmonter les persécutions et le doute, et à fixer ses regards sur Jésus, l'auteur et le consommateur de notre foi."
  },
  repentance: {
    term: "Repentance",
    aliases: ["repentance", "repentir", "se repentir", "metanoia", "teshouvah", "shuv"],
    originalWord: "Hébreu : שׁוּב (Shuv) / תְּשׁוּבָה (Teshouvah) — Grec : μετάνοια (Metanoia)",
    languageOrigin: "Grec / Hébreu",
    definition: "Changement radical d'esprit, d'orientation et de cœur par lequel un individu reconnaît sa culpabilité devant Dieu, éprouve une tristesse sincère selon Dieu pour ses péchés, et se détourne du mal pour se tourner résolument vers Dieu.",
    theologicalMeaning: "La vraie repentance n'est pas le simple remords (comme celui de Judas), mais une régénération du vouloir et du faire (comme celle du fils prodigue). Elle est la condition première annoncée par Jean-Baptiste, Jésus et les apôtres pour entrer dans le Royaume.",
    biblicalContext: "Prêchée dès l'Ancien Testament par les prophètes ('Revenez à Moi de tout votre cœur', Joël 2:12), inaugurée par Jésus ('Repentez-vous, car le royaume des cieux est proche', Matthieu 4:17), et exigée à la Pentecôte (Actes 2:38).",
    keyVerses: [
      { reference: "Actes 3:19", text: "Repentez-vous donc et convertissez-vous, pour que vos péchés soient effacés, afin que des temps de rafraîchissement viennent de la part du Seigneur." },
      { reference: "2 Corinthiens 7:10", text: "En effet, la tristesse selon Dieu produit une repentance à salut dont on ne se repent jamais, tandis que la tristesse du monde produit la mort." },
      { reference: "Luc 13:3", text: "Non, je vous le dis. Mais si vous ne vous repentez, vous périrez tous également." }
    ],
    spiritualApplication: "La repentance n'est pas seulement l'acte initial de la conversion, mais une attitude continuelle de vigilance et d'humilité devant Dieu lorsque le Saint-Esprit sonde notre cœur."
  },
  parousie: {
    term: "Parousie (Retour de Christ)",
    aliases: ["parousie", "retour", "avènement", "retour de christ", "parousia", "enlevement"],
    originalWord: "Grec : παρουσία (Parousia) — Présence, arrivée, avènement officiel d'un Roi",
    languageOrigin: "Grec",
    definition: "Le retour glorieux, visible et personnel du Seigneur Jésus-Christ à la fin des temps pour juger les vivants et les morts, ressusciter les saints, enlever Son Église et établir Son règne éternel de justice.",
    theologicalMeaning: "L'espérance bénie de l'Église (Tite 2:13). La parousie clôt l'ère de la grâce et de l'apostasie pour instaurer la plénitude du Royaume de Dieu. Elle est le cri d'espérance de l'Épouse : 'Maranatha ! Viens, Seigneur Jésus !'.",
    biblicalContext: "Enseignée dans les discours eschatologiques de Jésus (Matthieu 24, Luc 21), détaillée par Paul dans 1 Thessaloniciens 4 et 2 Thessaloniciens 2, et couronnée dans le livre de l'Apocalypse.",
    keyVerses: [
      { reference: "1 Thessaloniciens 4:16-17", text: "Car le Seigneur lui-même, à un signal donné, à la voix d'un archange, et au son de la trompette de Dieu, descendra du ciel, et les morts en Christ ressusciteront premièrement. Ensuite, nous les vivants, qui serons restés, nous serons tous ensemble enlevés avec eux sur des nuées, à la rencontre du Seigneur dans les airs." },
      { reference: "Matthieu 24:30", text: "Alors le signe du Fils de l'homme paraîtra dans le ciel, toutes les tribus de la terre se lamenteront, et elles verront le Fils de l'homme venant sur les nuées du ciel avec puissance et une grande gloire." },
      { reference: "Apocalypse 22:20", text: "Celui qui atteste ces choses dit: Oui, je viens bientôt. Amen! Viens, Seigneur Jésus!" }
    ],
    spiritualApplication: "La certitude du retour imminent de Christ appelle l'Église à la vigilance, au renoncement au monde et à un engagement missionnaire fervent pour hâter la proclamation de l'Évangile."
  },
  alliance: {
    term: "Alliance Biblique",
    aliases: ["alliance", "testament", "diatheke", "berith", "nouvelle alliance"],
    originalWord: "Hébreu : בְּרִית (Berith) — Grec : διαθήκη (Diatheke)",
    languageOrigin: "Grec / Hébreu",
    definition: "Engagement sacré, solennel et scellé par le sang, établi par Dieu envers l'humanité pour lui communiquer Ses promesses, Ses exigences et Sa communion d'amour.",
    theologicalMeaning: "L'histoire biblique s'articule autour des alliances divines (avec Noé, Abraham, Israël par Moïse, David), trouvant leur accomplissement parfait dans la Nouvelle Alliance scellée par le sang de Jésus-Christ.",
    biblicalContext: "De Genèse (l'alliance avec Abraham) à Jérémie 31 annonçant la Nouvelle Alliance intérieure, scellée lors de la Cène où Jésus déclare : « Cette coupe est la nouvelle alliance en mon sang » (Luc 22:20).",
    keyVerses: [
      { reference: "Jérémie 31:33", text: "Mais voici l'alliance que je ferai avec la maison d'Israël, après ces jours-là, dit l'Éternel: Je mettrai ma loi au dedans d'eux, je l'écrirai dans leur cœur; et je serai leur Dieu, et ils seront mon peuple." },
      { reference: "Hébreux 8:6", text: "Mais maintenant il a obtenu un ministère d'autant supérieur qu'il est le médiateur d'une alliance plus excellente, qui a été établie sur de meilleures promesses." },
      { reference: "1 Corinthiens 11:25", text: "De même, après avoir soupé, il prit la coupe, et dit: Cette coupe est la nouvelle alliance en mon sang; faites ceci en mémoire de moi toutes les fois que vous en boirez." }
    ],
    spiritualApplication: "En Christ, le croyant est participant des promesses de l'Alliance éternelle : Dieu est notre Père fidèle et nous appartenons à Son peuple saint pour l'éternité."
  },
  saint_esprit: {
    term: "Saint-Esprit (Pneumatologie)",
    aliases: ["saint-esprit", "saint esprit", "esprit", "paraclet", "ruach", "pneuma", "consolateur"],
    originalWord: "Hébreu : רוּחַ הַקֹּדֶשׁ (Ruach HaKodesh) — Grec : Πνεῦμα Ἅγιον (Pneuma Hagion) / Παράκλητος (Parakletos)",
    languageOrigin: "Grec / Hébreu",
    definition: "La troisième personne de la Sainte Trinité, pleinement Dieu, coéternel et consubstantiel au Père et au Fils, envoyé pour convaincre le monde de péché, régénérer le pécheur, consoler et sanctifier les disciples.",
    theologicalMeaning: "Le Saint-Esprit habite dans le croyant né de nouveau, produisant Son fruit d'amour, accordant des dons spirituels pour l'édification de l'Église, et garantissant l'héritage futur comme un gage (arrhes).",
    biblicalContext: "Présent dès la Création planant sur les eaux (Genèse 1:2), répandu avec puissance le jour de la Pentecôte (Actes 2), et décrit par Jésus dans Jean 14-16 comme le Consolateur et l'Esprit de vérité.",
    keyVerses: [
      { reference: "Jean 14:16-17", text: "Et moi, je prierai le Père, et il vous donnera un autre consolateur, afin qu'il demeure éternellement avec vous, l'Esprit de vérité." },
      { reference: "Actes 1:8", text: "Mais vous recevrez une puissance, le Saint-Esprit survenant sur vous, et vous serez mes témoins à Jérusalem, dans toute la Judée, dans la Samarie, et jusqu'aux extrémités de la terre." },
      { reference: "Galates 5:22-23", text: "Mais le fruit de l'Esprit, c'est l'amour, la joie, la paix, la patience, la bonté, la bénignité, la fidélité, la douceur, la tempérance." }
    ],
    spiritualApplication: "Marcher selon l'Esprit permet de ne pas accomplir les désirs de la chair, de vivre dans la communion fraternelle et de recevoir la force divine pour la prière et le service."
  },
  nouvelle_naissance: {
    term: "Nouvelle Naissance (Régénération)",
    aliases: ["nouvelle naissance", "régénération", "né de nouveau", "anagennao", "palingenesia"],
    originalWord: "Grec : ἄνωθεν γεννηθῆναι (Anothen Gennethenai) / παλιγγενεσία (Palingenesia)",
    languageOrigin: "Grec",
    definition: "Transformation spirituelle miraculeuse opérée par le Saint-Esprit par laquelle une personne spirituellement morte reçoit une vie nouvelle en Christ et devient enfant de Dieu.",
    theologicalMeaning: "Ce n'est pas une simple réforme morale, mais une recréation intérieure où le cœur de pierre est ôté et remplacé par un cœur nouveau obedient à la Parole.",
    biblicalContext: "Entretien nocturne de Jésus avec Nicodème dans Jean 3 : « Si un homme ne naît d'eau et d'Esprit, il ne peut entrer dans le royaume de Dieu » (Jean 3:5).",
    keyVerses: [
      { reference: "Jean 3:3", text: "Jésus lui répondit: En vérité, en vérité, je te le dis, si un homme ne naît de nouveau, il ne peut voir le royaume de Dieu." },
      { reference: "2 Corinthiens 5:17", text: "Si quelqu'un est en Christ, il est une nouvelle créature. Les choses anciennes sont passées; voici, toutes choses sont devenues nouvelles." },
      { reference: "1 Pierre 1:23", text: "Puisque vous avez été régénérés, non par une semence corruptible, mais par une semence incorruptible, par la vivante et permanente parole de Dieu." }
    ],
    spiritualApplication: "La nouvelle naissance se manifeste par l'amour fraternel, la haine du péché et le désir ardent de conformer sa vie aux enseignements du Christ."
  }
};

/**
 * Searches the local theological dictionary by term or alias
 */
export function findLocalTheologicalConcept(query: string): TheologicalConcept | null {
  if (!query || !query.trim()) return null;
  const normalized = query.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Direct key lookup
  for (const [key, concept] of Object.entries(THEOLOGICAL_DICTIONARY)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return concept;
    }
    const match = concept.aliases.some(a => {
      const normA = a.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return normA === normalized || normalized.includes(normA) || normA.includes(normalized);
    });
    if (match) return concept;
  }

  return null;
}
