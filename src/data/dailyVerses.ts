import { BibleVersionId } from '../types';
import { BIBLE_BOOKS, getLocalizedBookName } from './bibleData';

/**
 * Curated 31-day rotating Biblical Verses for Daily Spiritual Edification.
 * Supports authentic Multi-Version scriptures matching the selected language:
 * - FR: Louis Segond 1910 (LSG)
 * - EN: King James Version (KJV)
 * - SW: Biblia ya Kiswahili Zanzibar / Union (SW-ZAN)
 * - LN: Biblia na Lingála / Biblica (LN-BIB)
 * - ES: Reina-Valera 1960 (RVR)
 */

export interface DailyVerseItem {
  id: number;
  reference: string;
  referenceByLang: Record<string, string>;
  text: string; // Default Louis Segond (FR)
  theme: string; // Default FR
  translationsByVersion: Partial<Record<BibleVersionId | 'RVR', string>>;
  themeByLang: Record<string, string>;
}

export const LANGUAGE_TO_DEFAULT_BIBLE_VERSION: Record<string, BibleVersionId> = {
  fr: 'LSG',
  en: 'KJV',
  sw: 'SW-ZAN',
  ln: 'LN-BIB',
  es: 'RVR',
  pt: 'KJV',
  de: 'KJV',
  it: 'LSG',
  kg: 'LN-BIB',
  lu: 'SW-ZAN'
};

export const BIBLE_VERSION_LABELS: Record<string, string> = {
  'LSG': 'Louis Segond 1910 (Français)',
  'KJV': 'King James Version (English)',
  'SW-ZAN': 'Biblia ya Kiswahili (Kiswahili)',
  'LN-BIB': 'Biblia na Lingála (Lingála)',
  'BFC': 'Français Courant (Français)',
  'BDS': 'Bible du Semeur (Français)',
  'RVR': 'Reina-Valera 1960 (Español)'
};

export const ROTATING_DAILY_VERSES: DailyVerseItem[] = [
  // Jour 1: 1 Pierre 5:10 - Le verset central des 5 Étapes Spirituelles
  {
    id: 1,
    reference: "1 Pierre 5:10",
    referenceByLang: {
      fr: "1 Pierre 5:10",
      en: "1 Peter 5:10",
      sw: "1 Petro 5:10",
      ln: "1 Petelo 5:10",
      es: "1 Pedro 5:10"
    },
    text: "Le Dieu de toute grâce, qui vous a appelés en Jésus-Christ à sa gloire éternelle, après que vous aurez souffert un peu de temps, vous perfectionnera lui-même, vous affermira, vous fortifiera, vous rendra inébranlables.",
    theme: "La Grâce Souveraine & Le Perfectionnement Divin (Les 5 Étapes)",
    translationsByVersion: {
      LSG: "Le Dieu de toute grâce, qui vous a appelés en Jésus-Christ à sa gloire éternelle, après que vous aurez souffert un peu de temps, vous perfectionnera lui-même, vous affermira, vous fortifiera, vous rendra inébranlables.",
      KJV: "But the God of all grace, who hath called us unto his eternal glory by Christ Jesus, after that ye have suffered a while, make you perfect, stablish, strengthen, settle you.",
      'SW-ZAN': "Na Mungu wa neema yote, aliyewaita kuingia katika utukufu wake wa milele katika Kristo Yesu, mkiisha kuteswa kwa muda mfupi, yeye mwenyewe atawatengeneza kamilifu, atawathibitisha, atawatia nguvu, na kuwaweka imara.",
      'LN-BIB': "Kasi Nzambe ya ngolu nyonso, oyo abiangaki bino na nkembo na Ye ya seko kati na Klisto Yesu, nsima na bino komona pasi mwa moke, Ye moko akokomisa bino bato ya kokoka, akolendisa bino, akopesa bino makasi mpe akotia bino na esika ya kokwea te.",
      RVR: "Mas el Dios de toda gracia, que nos llamó a su gloria eterna en Jesucristo, después que hayáis padecido un poco de tiempo, él mismo os perfeccione, afirme, fortalezca y establezca."
    },
    themeByLang: {
      fr: "La Grâce Souveraine & Le Perfectionnement Divin (Les 5 Étapes)",
      en: "Sovereign Grace & Divine Perfection (The 5 Spiritual Steps)",
      sw: "Neema ya Mungu na Ukamilisho wa Kimungu (Hatua 5 za Kiroho)",
      ln: "Ngolu ya Nzambe mpe Bokomi na Kokoka (Biteni 5 ya Molimo)",
      es: "La Gracia Soberana y el Perfeccionamiento Divino (Las 5 Etapas)"
    }
  },

  // Jour 2: 1 Jean 2:18 - Verset fondateur de la Bibliothèque Chrétienne
  {
    id: 2,
    reference: "1 Jean 2:18",
    referenceByLang: {
      fr: "1 Jean 2:18",
      en: "1 John 2:18",
      sw: "1 Yohana 2:18",
      ln: "1 Yoane 2:18",
      es: "1 Juan 2:18"
    },
    text: "Petits enfants, c'est la dernière heure, et comme vous avez appris qu'un antéchrist vient, il y a maintenant plusieurs antéchrists : par là nous connaissons que c'est la dernière heure.",
    theme: "Vigilance et Discernement Spirituel pour la Dernière Heure",
    translationsByVersion: {
      LSG: "Petits enfants, c'est la dernière heure, et comme vous avez appris qu'un antéchrist vient, il y a maintenant plusieurs antéchrists : par là nous connaissons que c'est la dernière heure.",
      KJV: "Little children, it is the last time: and as ye have heard that antichrist shall come, even now are there many antichrists; whereby we know that it is the last time.",
      'SW-ZAN': "Watoto wadogo, ni saa ya mwisho; na kama vile mlivyosikia kwamba mpinga Kristo anakuja, hata sasa wapinga Kristo wengi wamekwisha kutokea; kwa hiyo twajua ya kuwa ni saa ya mwisho.",
      'LN-BIB': "Bana mike, oyo ezali ngonga ya suka ! Ndenge boyokaki ete monguna ya Klisto azali koya, sika oyo banguna ya Klisto bazali mingi. Yango wana toyebi ete oyo ezali ngonga ya suka.",
      RVR: "Hijitos, ya es el último tiempo; y según vosotros oísteis que el anticristo viene, así ahora han surgido muchos anticristos; por esto conocemos que es el último tiempo."
    },
    themeByLang: {
      fr: "Vigilance et Discernement Spirituel pour la Dernière Heure",
      en: "Vigilance and Spiritual Discernment for the Last Hour",
      sw: "Ukeshaji na Utambuzi wa Kiroho kwa Saa ya Mwisho",
      ln: "Kokengela mpe Bososoli ya Molimo na Ngonga ya Suka",
      es: "Vigilancia y Discernimiento Espiritual para la Última Hora"
    }
  },

  // Jour 3: Hébreux 12:14 - La Sainteté indispensable
  {
    id: 3,
    reference: "Hébreux 12:14",
    referenceByLang: {
      fr: "Hébreux 12:14",
      en: "Hebrews 12:14",
      sw: "Waebrania 12:14",
      ln: "Baebele 12:14",
      es: "Hebreos 12:14"
    },
    text: "Recherchez la paix avec tous, et la sanctification, sans laquelle personne ne verra le Seigneur.",
    theme: "La Sainteté Absolue et Indispensable pour Voir Dieu",
    translationsByVersion: {
      LSG: "Recherchez la paix avec tous, et la sanctification, sans laquelle personne ne verra le Seigneur.",
      KJV: "Follow peace with all men, and holiness, without which no man shall see the Lord.",
      'SW-ZAN': "Tafuteni kwa bidii kuwa na amani na watu wote, na huo utakatifu, ambao hapana mtu atakayemwona Bwana asipokuwa nao.",
      'LN-BIB': "Boluka kimya elongo na bato nyonso mpe boluka bopeto, pamba te moto moko te akomona Nkolo soki azali mpeto te.",
      RVR: "Seguid la paz con todos, y la santidad, sin la cual nadie verá al Señor."
    },
    themeByLang: {
      fr: "La Sainteté Absolue et Indispensable pour Voir Dieu",
      en: "Absolute Holiness Essential to See the Lord",
      sw: "Utakatifu Kamili Usio na Masharti Kumwona Mungu",
      ln: "Bopeto ya Solo mpo na Komona Nkolo",
      es: "La Santidad Absoluta e Indispensable para Ver al Señor"
    }
  },

  // Jour 4: Matthieu 24:42 - Sainte veille
  {
    id: 4,
    reference: "Matthieu 24:42",
    referenceByLang: {
      fr: "Matthieu 24:42",
      en: "Matthew 24:42",
      sw: "Mathayo 24:42",
      ln: "Matayo 24:42",
      es: "Mateo 24:42"
    },
    text: "Veillez donc, puisque vous ne savez pas quel jour votre Seigneur viendra.",
    theme: "La Sainte Veille et la Préparation au Retour de Christ",
    translationsByVersion: {
      LSG: "Veillez donc, puisque vous ne savez pas quel jour votre Seigneur viendra.",
      KJV: "Watch therefore: for ye know not what hour your Lord doth come.",
      'SW-ZAN': "Kesheni basi; kwa maana hamjui ni siku ipi atakayokuja Bwana wenu.",
      'LN-BIB': "Bokengela bongo, pamba te boyebi mokolo te oyo Nkolo na bino akoya.",
      RVR: "Velad, pues, porque no sabéis a qué hora ha de venir vuestro Señor."
    },
    themeByLang: {
      fr: "La Sainte Veille et la Préparation au Retour de Christ",
      en: "Holy Watchfulness and Readiness for Christ's Return",
      sw: "Mkesho Mtakatifu na Kujiandaa kwa Kurudi kwa Kristo",
      ln: "Kokengela ya Bopeto mpe Komibongisa mpo na Boyei ya Klisto",
      es: "La Santa Vigilancia y la Preparación para la Venida de Cristo"
    }
  },

  // Jour 5: 1 Thessaloniciens 5:23-24 - Sanctification intégrale
  {
    id: 5,
    reference: "1 Thessaloniciens 5:23-24",
    referenceByLang: {
      fr: "1 Thessaloniciens 5:23-24",
      en: "1 Thessalonians 5:23-24",
      sw: "1 Wathesalonike 5:23-24",
      ln: "1 Batesaloniki 5:23-24",
      es: "1 Tesalonicenses 5:23-24"
    },
    text: "Que le Dieu de paix vous sanctifie lui-même tout entiers, et que tout votre être, l'esprit, l'âme et le corps, soit conservé irrépréhensible, lors de l'avènement de notre Seigneur Jésus-Christ ! Celui qui vous a appelés est fidèle, et c'est lui qui le fera.",
    theme: "Sanctification Intégrale de l'Esprit, de l'Âme et du Corps",
    translationsByVersion: {
      LSG: "Que le Dieu de paix vous sanctifie lui-même tout entiers, et que tout votre être, l'esprit, l'âme et le corps, soit conservé irrépréhensible, lors de l'avènement de notre Seigneur Jésus-Christ ! Celui qui vous a appelés est fidèle, et c'est lui qui le fera.",
      KJV: "And the very God of peace sanctify you wholly; and I pray God your whole spirit and soul and body be preserved blameless unto the coming of our Lord Jesus Christ. Faithful is he that calleth you, who also will do it.",
      'SW-ZAN': "Mungu wa amani mwenyewe awatakase kabisa; nanyi nafsi zenu nzima, roho zenu, na roho zenu, na miili yenu, mhifadhiwe msiwe na hatia, wakati wa kuja kwake Bwana wetu Yesu Kristo. Yeye ni mwaminifu anayewaita, naye atafanya.",
      'LN-BIB': "Tika ete Nzambe ya kimya Ye moko apɛtola bino mobimba ; mpe tika ete molimo, molimo ya kati mpe nzoto na bino ebatelama malamu mpenza kozanga mbeba tii na boyei ya Nkolo na biso Yesu Klisto. Ye oyo abiangaki bino azali sembo, mpe akosala yango.",
      RVR: "Y el mismo Dios de paz os santifique por completo; y todo vuestro ser, espíritu, alma y cuerpo, sea guardado irreprensible para la venida de nuestro Señor Jesucristo. Fiel es el que os llama, el cual también lo hará."
    },
    themeByLang: {
      fr: "Sanctification Intégrale de l'Esprit, de l'Âme et du Corps",
      en: "Total Sanctification of Spirit, Soul, and Body",
      sw: "Utakaso Kamili wa Roho, Nafsi, na Mwili",
      ln: "Bopetoli ya Mobimba ya Molimo mpe Nzoto",
      es: "Santificación Integral del Espíritu, Alma y Cuerpo"
    }
  },

  // Jour 6: Romains 12:1-2 - Sacrifice vivant
  {
    id: 6,
    reference: "Romains 12:1-2",
    referenceByLang: {
      fr: "Romains 12:1-2",
      en: "Romans 12:1-2",
      sw: "Warumi 12:1-2",
      ln: "Baroma 12:1-2",
      es: "Romanos 12:1-2"
    },
    text: "Je vous exhorte donc, frères, par les compassions de Dieu, à offrir vos corps comme un sacrifice vivant, saint, agréable à Dieu, ce qui sera de votre part un culte raisonnable. Ne vous conformez pas au siècle présent, mais soyez transformés par le renouvellement de l'intelligence...",
    theme: "Consécration Vivante et Renouvellement Spirituel",
    translationsByVersion: {
      LSG: "Je vous exhorte donc, frères, par les compassions de Dieu, à offrir vos corps comme un sacrifice vivant, saint, agréable à Dieu, ce qui sera de votre part un culte raisonnable. Ne vous conformez pas au siècle présent, mais soyez transformés par le renouvellement de l'intelligence...",
      KJV: "I beseech you therefore, brethren, by the mercies of God, that ye present your bodies a living sacrifice, holy, acceptable unto God, which is your reasonable service. And be not conformed to this world: but be ye transformed by the renewing of your mind...",
      'SW-ZAN': "Basi, ndugu zangu, nawasihi, kwa huruma zake Mungu, itoeni miili yenu iwe dhabihu iliyo hai, takatifu, ya kumpendeza Mungu, ndiyo ibada yenu yenye maana. Wala msiifuatishe namna ya dunia hii; bali mgeuzwe kwa kufanywa upya nia zenu...",
      'LN-BIB': "Bongo bandeko, mpo na mawa monene ya Nzambe, nazali kobondela bino ete bopesa nzoto na bino lokola mbeka ya bomoi, ya bopeto mpe oyo ezali kosepelisa Nzambe. Yango nde losambo ya solo. Bokoma te lokola bato ya mokili oyo...",
      RVR: "Así que, hermanos, os ruego por las misericordias de Dios, que presentéis vuestros cuerpos en sacrificio vivo, santo, agradable a Dios, que es vuestro culto racional. No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento..."
    },
    themeByLang: {
      fr: "Consécration Vivante et Renouvellement Spirituel",
      en: "Living Consecration and Spiritual Renewal",
      sw: "Kujitolea Kuliko Hai na Kufanywa Upya Kiroho",
      ln: "Kopesa Nzoto Mbeka ya Bomoi mpe Mbongwana ya Mayele",
      es: "Consagración Viva y Renovación Espiritual"
    }
  },

  // Jour 7: 2 Timothée 2:19 - Le solide fondement
  {
    id: 7,
    reference: "2 Timothée 2:19",
    referenceByLang: {
      fr: "2 Timothée 2:19",
      en: "2 Timothy 2:19",
      sw: "2 Timotheo 2:19",
      ln: "2 Timote 2:19",
      es: "2 Timoteo 2:19"
    },
    text: "Néanmoins, le solide fondement posé par Dieu subsiste, avec ces paroles qui lui servent de sceau : Le Seigneur connaît ceux qui lui appartiennent; et : Quiconque prononce le nom du Seigneur, qu'il s'éloigne de l'iniquité.",
    theme: "Le Sceau Inébranlable de Dieu et l'Éloignement de l'Iniquité",
    translationsByVersion: {
      LSG: "Néanmoins, le solide fondement posé par Dieu subsiste, avec ces paroles qui lui servent de sceau : Le Seigneur connaît ceux qui lui appartiennent; et : Quiconque prononce le nom du Seigneur, qu'il s'éloigne de l'iniquité.",
      KJV: "Nevertheless the foundation of God standeth sure, having this seal, The Lord knoweth them that are his. And, Let every one that nameth the name of Christ depart from iniquity.",
      'SW-ZAN': "Lakini msingi wa Mungu ulio imara umesimama, wenye muhuri hii: Bwana awajua walio wake; tena, Kila alitajaye jina la Bwana na aache uovu.",
      'LN-BIB': "Kasi moboko ya makasi oyo Nzambe atia ezali kaka kolonga, mpe etiami elembo oyo : Nkolo ayebi baoyo bazali ya Ye ; mpe : Moto nyonso oyo atangaka nkombo ya Nkolo, atika mabe.",
      RVR: "Pero el fundamento de Dios está firme, teniendo este sello: Conoce el Señor a los que son suyos; y: Apártese de iniquidad todo aquel que invoca el nombre de Cristo."
    },
    themeByLang: {
      fr: "Le Sceau Inébranlable de Dieu et l'Éloignement de l'Iniquité",
      en: "The Unshakeable Seal of God and Departing from Iniquity",
      sw: "Muhuri Imara ya Mungu na Kujitenga na Uovu",
      ln: "Elembo ya Makasi ya Nzambe mpe Kotika Mabe",
      es: "El Sello Inconmovible de Dios y el Apartarse de la Iniquidad"
    }
  },

  // Jour 8: Apocalypse 3:11 - Retiens ta couronne
  {
    id: 8,
    reference: "Apocalypse 3:11",
    referenceByLang: {
      fr: "Apocalypse 3:11",
      en: "Revelation 3:11",
      sw: "Ufunuo 3:11",
      ln: "Emoniseli 3:11",
      es: "Apocalipsis 3:11"
    },
    text: "Je viens bientôt. Retiens ce que tu as, afin que personne ne prenne ta couronne.",
    theme: "Persévérance et Préservation Fidèle de la Couronne Céleste",
    translationsByVersion: {
      LSG: "Je viens bientôt. Retiens ce que tu as, afin que personne ne prenne ta couronne.",
      KJV: "Behold, I come quickly: hold that fast which thou hast, that no man take thy crown.",
      'SW-ZAN': "Naja upesi. Shika sana ulicho nacho, asije mtu akaitwaa taji yako.",
      'LN-BIB': "Nazali koya noki ! Simba makasi oyo ozali na yango, noki te moto mosusu abotola motole na yo.",
      RVR: "He aquí, yo vengo pronto; retén lo que tienes, para que ninguno tome tu corona."
    },
    themeByLang: {
      fr: "Persévérance et Préservation Fidèle de la Couronne Céleste",
      en: "Perseverance and Guarding the Heavenly Crown",
      sw: "Kuvumilia na Kushikilia Taji ya Mbinguni",
      ln: "Kotingama mpe Kobatela Motole ya Likolo",
      es: "Perseverancia y Preservación de la Corona Celestial"
    }
  },

  // Jour 9: Psaume 119:105 - La lampe à mes pieds
  {
    id: 9,
    reference: "Psaume 119:105",
    referenceByLang: {
      fr: "Psaume 119:105",
      en: "Psalm 119:105",
      sw: "Zaburi 119:105",
      ln: "Nzembo 119:105",
      es: "Salmos 119:105"
    },
    text: "Ta parole est une lampe à mes pieds, et une lumière sur mon sentier.",
    theme: "La Lumière Infaillible des Saintes Écritures",
    translationsByVersion: {
      LSG: "Ta parole est une lampe à mes pieds, et une lumière sur mon sentier.",
      KJV: "Thy word is a lamp unto my feet, and a light unto my path.",
      'SW-ZAN': "Neno lako ni taa ya miguu yangu, na mwanga wa njia yangu.",
      'LN-BIB': "Liloba na Yo ezali mwinda mpo na makolo na ngai, mpe pole mpo na nzela na ngai.",
      RVR: "Lámpara es a mis pies tu palabra, y lumbrera a mi camino."
    },
    themeByLang: {
      fr: "La Lumière Infaillible des Saintes Écritures",
      en: "The Infallible Light of the Holy Scriptures",
      sw: "Nuru Isiyoshindwa ya Maandiko Matakatifu",
      ln: "Pole ya Solo ya Liloba ya Nzambe",
      es: "La Luz Infalible de las Sagradas Escrituras"
    }
  },

  // Jour 10: Ésaïe 40:31 - Renouvellement de la force
  {
    id: 10,
    reference: "Ésaïe 40:31",
    referenceByLang: {
      fr: "Ésaïe 40:31",
      en: "Isaiah 40:31",
      sw: "Isaya 40:31",
      ln: "Yisaya 40:31",
      es: "Isaías 40:31"
    },
    text: "Mais ceux qui se confient en l'Éternel renouvellent leur force. Ils prennent le vol comme les aigles; ils courent, et ne se lassent point; ils marchent, et ne se fatiguent point.",
    theme: "Le Renouvellement de la Force par la Foi en l'Éternel",
    translationsByVersion: {
      LSG: "Mais ceux qui se confient en l'Éternel renouvellent leur force. Ils prennent le vol comme les aigles; ils courent, et ne se lassent point; ils marchent, et ne se fatiguent point.",
      KJV: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.",
      'SW-ZAN': "Bali wao wamngojeao Bwana watapata nguvu mpya; watapanda juu kwa mbawa kama tai; watapiga mbio, wala hawatachoka; watakwenda kwa miguu, wala hawatazimia.",
      'LN-BIB': "Kasi baoyo batielaka Yawe motema bakozwa makasi ya sika ; bakopumbwa likolo lokola mpongo ; bakopota mbangu kasi bakolɛmba te ; bakotambola kasi bakozoka te.",
      RVR: "Pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas; correrán, y no se cansarán; caminarán, y no se fatigarán."
    },
    themeByLang: {
      fr: "Le Renouvellement de la Force par la Foi en l'Éternel",
      en: "Renewal of Strength through Faith in the Lord",
      sw: "Kufanywa Upya kwa Nguvu kwa Kumngoja Bwana",
      ln: "Bozwi ya Makasi ya Sika na Kotiela Yawe Motema",
      es: "La Renovación de las Fuerzas por la Fe en el Señor"
    }
  },

  // Jour 11: Éphésiens 5:14 - L'appel au réveil
  {
    id: 11,
    reference: "Éphésiens 5:14",
    referenceByLang: {
      fr: "Éphésiens 5:14",
      en: "Ephesians 5:14",
      sw: "Waefeso 5:14",
      ln: "Baefese 5:14",
      es: "Efesios 5:14"
    },
    text: "Réveille-toi, toi qui dors, relève-toi d'entre les morts, et Christ t'éclairera.",
    theme: "L'Appel Divin au Réveil Spirituel des Disciples",
    translationsByVersion: {
      LSG: "Réveille-toi, toi qui dors, relève-toi d'entre les morts, et Christ t'éclairera.",
      KJV: "Wherefore he saith, Awake thou that sleepest, and arise from the dead, and Christ shall give thee light.",
      'SW-ZAN': "Amka, wewe usinziaye, ufufuke katika wafu, na Kristo atakuangaza.",
      'LN-BIB': "Lamuka, yo oyo ozali kolala ! Telama kati na bakufi, mpe Klisto akongɛngisa yo !",
      RVR: "Despiértate, tú que duermes, y levántate de los muertos, y te alumbrará Cristo."
    },
    themeByLang: {
      fr: "L'Appel Divin au Réveil Spirituel des Disciples",
      en: "The Divine Call to Spiritual Awakening",
      sw: "Wito wa Kimungu wa Kuamka Kiroho",
      ln: "Libiangi ya Nzambe mpo na Kolamuka na Molimo",
      es: "El Llamado Divino al Despertar Espiritual"
    }
  },

  // Jour 12: 1 Corinthiens 15:58 - Fermes et inébranlables
  {
    id: 12,
    reference: "1 Corinthiens 15:58",
    referenceByLang: {
      fr: "1 Corinthiens 15:58",
      en: "1 Corinthians 15:58",
      sw: "1 Wakorintho 15:58",
      ln: "1 Bakolinto 15:58",
      es: "1 Corintios 15:58"
    },
    text: "Ainsi, mes frères bien-aimés, soyez fermes, inébranlables, progressant toujours dans l'œuvre du Seigneur, sachant que votre travail ne sera pas vain dans le Seigneur.",
    theme: "Fermeté, Constance et Travail Saint pour l'Éternité",
    translationsByVersion: {
      LSG: "Ainsi, mes frères bien-aimés, soyez fermes, inébranlables, progressant toujours dans l'œuvre du Seigneur, sachant que votre travail ne sera pas vain dans le Seigneur.",
      KJV: "Therefore, my beloved brethren, be ye stedfast, unmoveable, always abounding in the work of the Lord, forasmuch as ye know that your labour is not in vain in the Lord.",
      'SW-ZAN': "Basi, ndugu zangu wapendwa, mwimarike, msitikisike, mkizidi sana kutenda kazi ya Bwana sikuzote, kwa kuwa mwajua ya kwamba taabu yenu si bure katika Bwana.",
      'LN-BIB': "Yango wana bandeko na ngai ya bolingo, bozala ngwi, bopikama makasi, boyikela mosala ya Nkolo mikolo nyonso pamba te boyebi ete mosala na bino ekozala ya pamba te kati na Nkolo.",
      RVR: "Así que, hermanos míos amados, estad firmes y constantes, creciendo en la obra del Señor siempre, sabiendo que vuestro trabajo en el Señor no es en vano."
    },
    themeByLang: {
      fr: "Fermeté, Constance et Travail Saint pour l'Éternité",
      en: "Steadfastness and Faithful Labor in the Lord",
      sw: "Uimara na Kazi Takatifu Isiyo na Kikomo Ndani ya Bwana",
      ln: "Bopikami Makasi mpe Mosala ya Bopeto mpo na Nkolo",
      es: "Firmeza, Constancia y Trabajo Santo para la Eternidad"
    }
  },

  // Jour 13: Jacques 4:7-8 - Soumission à Dieu
  {
    id: 13,
    reference: "Jacques 4:7-8",
    referenceByLang: {
      fr: "Jacques 4:7-8",
      en: "James 4:7-8",
      sw: "Yakobo 4:7-8",
      ln: "Yakobo 4:7-8",
      es: "Santiago 4:7-8"
    },
    text: "Soumettez-vous donc à Dieu; résistez au diable, et il fuira loin de vous. Approchez-vous de Dieu, et il s'approchera de vous.",
    theme: "Soumission Intégrale à Dieu et Triomphe sur l'Ennemi",
    translationsByVersion: {
      LSG: "Soumettez-vous donc à Dieu; résistez au diable, et il fuira loin de vous. Approchez-vous de Dieu, et il s'approchera de vous.",
      KJV: "Submit yourselves therefore to God. Resist the devil, and he will flee from you. Draw nigh to God, and he will draw nigh to you.",
      'SW-ZAN': "Basi mtiini Mungu. Mpingeni Shetani, naye atawakimbia. Mkaribieni Mungu, naye atawakaribia ninyi.",
      'LN-BIB': "Botosela Nzambe ; botelemela Zabolo mpe akokima mosika na bino. Bopusana pene na Nzambe, mpe Ye moko akopusana pene na bino.",
      RVR: "Someteos, pues, a Dios; resistid al diablo, y huirá de vosotros. Acercaos a Dios, y él se acercará a vosotros."
    },
    themeByLang: {
      fr: "Soumission Intégrale à Dieu et Triomphe sur l'Ennemi",
      en: "Total Submission to God and Victory over the Enemy",
      sw: "Kujitiisha kwa Mungu na Kushinda Adui",
      ln: "Botosi Mobimba na Nzambe mpe Kolonga Monguna",
      es: "Sometimiento a Dios y Victoria sobre el Enemigo"
    }
  },

  // Jour 14: 2 Pierre 3:11-12 - Sainte conduite
  {
    id: 14,
    reference: "2 Pierre 3:11-12",
    referenceByLang: {
      fr: "2 Pierre 3:11-12",
      en: "2 Peter 3:11-12",
      sw: "2 Petro 3:11-12",
      ln: "2 Petelo 3:11-12",
      es: "2 Pedro 3:11-12"
    },
    text: "Puisque donc toutes ces choses doivent se dissoudre, quelles ne doivent pas être la sainteté de votre conduite et votre piété, tandis que vous attendez et hâtez l'avènement du jour de Dieu !",
    theme: "La Sainte Marche dans l'Attente du Jour de Dieu",
    translationsByVersion: {
      LSG: "Puisque donc toutes ces choses doivent se dissoudre, quelles ne doivent pas être la sainteté de votre conduite et votre piété, tandis que vous attendez et hâtez l'avènement du jour de Dieu !",
      KJV: "Seeing then that all these things shall be dissolved, what manner of persons ought ye to be in all holy conversation and godliness, Looking for and hasting unto the coming of the day of God...",
      'SW-ZAN': "Basi, kwa kuwa vitu hivi vyote vitayeyushwa hivyo, imewapasa ninyi kuwa watu wa tabia gani katika mwenendo mtakatifu na utauwa, mkitazamia na kuihimiza siku ile ya Mungu...",
      'LN-BIB': "Lokola biloko oyo nyonso ekobomama bongo, lolenge nini ya bato bino bosengeli kozala ? Bosengeli kotambola na bopeto mpe na botosi mpo na Nzambe, wana bozali kozela mokolo ya Nzambe !",
      RVR: "Puesto que todas estas cosas han de ser deshechas, ¡cómo no debéis vosotros andar en santa y piadosa manera de vivir, esperando y apresurándoos para la venida del día de Dios!"
    },
    themeByLang: {
      fr: "La Sainte Marche dans l'Attente du Jour de Dieu",
      en: "Holy Living while Awaiting the Day of God",
      sw: "Mwenendo Mtakatifu katika Kuitazamia Siku ya Mungu",
      ln: "Etamboli ya Bopeto wana Bozali Kozela Mokolo ya Nzambe",
      es: "La Santa Manera de Vivir Esperando el Día de Dios"
    }
  },

  // Jour 15: Colossiens 3:1-2 - Les choses d'en haut
  {
    id: 15,
    reference: "Colossiens 3:1-2",
    referenceByLang: {
      fr: "Colossiens 3:1-2",
      en: "Colossians 3:1-2",
      sw: "Wakolosai 3:1-2",
      ln: "Bakolose 3:1-2",
      es: "Colosenses 3:1-2"
    },
    text: "Si donc vous êtes ressuscités avec Christ, cherchez les choses d'en haut, où Christ est assis à la droite de Dieu. Affectionnez-vous aux choses d'en haut, et non à celles qui sont sur la terre.",
    theme: "Attachement aux Réalités Célestes et Victoire sur le Monde",
    translationsByVersion: {
      LSG: "Si donc vous êtes ressuscités avec Christ, cherchez les choses d'en haut, où Christ est assis à la droite de Dieu. Affectionnez-vous aux choses d'en haut, et non à celles qui sont sur la terre.",
      KJV: "If ye then be risen with Christ, seek those things which are above, where Christ sitteth on the right hand of God. Set your affection on things above, not on things on the earth.",
      'SW-ZAN': "Basi mkiwa mmefufuka pamoja na Kristo, yatafuteni yaliyo juu, Kristo aliko, ameketi mkono wa kuume wa Mungu. Yafikirini yaliyo juu, siyo yaliyo katika nchi.",
      'LN-BIB': "Lokola bosekwaki elongo na Klisto, boluka biloko ya likolo esika Klisto avandi na ngambo ya mobali ya Nzambe. Bomipesa mobimba na biloko ya likolo, kasi na biloko ya mokili te.",
      RVR: "Si, pues, habéis resucitado con Cristo, buscad las cosas de arriba, donde está Cristo sentado a la diestra de Dios. Poned la mira en las cosas de arriba, no en las de la tierra."
    },
    themeByLang: {
      fr: "Attachement aux Réalités Célestes et Victoire sur le Monde",
      en: "Fixing Affections on Heavenly Things Above",
      sw: "Kuyashikilia Mambo ya Juu Mbinguni",
      ln: "Komipesa na Makambo ya Likolo",
      es: "Afecto a las Cosas Celestiales de Arriba"
    }
  },

  // Jour 16: Galates 2:20 - Crucifié avec Christ
  {
    id: 16,
    reference: "Galates 2:20",
    referenceByLang: {
      fr: "Galates 2:20",
      en: "Galatians 2:20",
      sw: "Wagalatia 2:20",
      ln: "Bagalatia 2:20",
      es: "Gálatas 2:20"
    },
    text: "J'ai été crucifié avec Christ; et si je vis, ce n'est plus moi qui vis, c'est Christ qui vit en moi; si je vis maintenant dans la chair, je vis dans la foi au Fils de Dieu, qui m'a aimé et qui s'est livré lui-même pour moi.",
    theme: "La Mort à Soi-Même et la Vie Vivante de Christ en Nous",
    translationsByVersion: {
      LSG: "J'ai été crucifié avec Christ; et si je vis, ce n'est plus moi qui vis, c'est Christ qui vit en moi; si je vis maintenant dans la chair, je vis dans la foi au Fils de Dieu, qui m'a aimé et qui s'est livré lui-même pour moi.",
      KJV: "I am crucified with Christ: nevertheless I live; yet not I, but Christ liveth in me: and the life which I now live in the flesh I live by the faith of the Son of God, who loved me, and gave himself for me.",
      'SW-ZAN': "Nimesulubiwa pamoja na Kristo; lakini ni hai; wala si mimi tena, bali Kristo yu hai ndani yangu; na uhai nilio nao sasa katika mwili, ninao katika imani ya Mwana wa Mungu, ambaye alinipenda, akajitoa nafsi yake kwa ajili yangu.",
      'LN-BIB': "Babakaki ngai na kurusa elongo na Klisto ; ngai moko nazali lisusu na bomoi te, kasi Klisto nde azali na bomoi kati na ngai. Bomoi oyo nazali na yango sika kati na nzoto, nazali na yango mpo na kondima na Mwana ya Nzambe oyo alingaki ngai mpe amipesaki mpo na ngai.",
      RVR: "Con Cristo estoy juntamente crucificado, y ya no vivo yo, mas vive Cristo en mí; y lo que ahora vivo en la carne, lo vivo en la fe del Hijo de Dios, el cual me amó y se entregó a sí mismo por mí."
    },
    themeByLang: {
      fr: "La Mort à Soi-Même et la Vie Vivante de Christ en Nous",
      en: "Death to Self and the Living Christ within Us",
      sw: "Kufa kwa Nafsi na Kristo Kuishi Ndani Yetu",
      ln: "Kokufa mpo na Yo Moko mpe Klisto Kofanda Kati na Yo",
      es: "La Muerte al Yo y la Vida de Cristo en Nosotros"
    }
  },

  // Jour 17: Philippiens 4:6-7 - La paix de Dieu
  {
    id: 17,
    reference: "Philippiens 4:6-7",
    referenceByLang: {
      fr: "Philippiens 4:6-7",
      en: "Philippians 4:6-7",
      sw: "Wafilipi 4:6-7",
      ln: "Bafilipi 4:6-7",
      es: "Filipenses 4:6-7"
    },
    text: "Ne vous inquiétez de rien; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications, avec des actions de grâces. Et la paix de Dieu, qui surpasse toute intelligence, gardera vos cœurs et vos pensées en Jésus-Christ.",
    theme: "La Paix Surnaturelle de Dieu par la Prière Persévérante",
    translationsByVersion: {
      LSG: "Ne vous inquiétez de rien; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications, avec des actions de grâces. Et la paix de Dieu, qui surpasse toute intelligence, gardera vos cœurs et vos pensées en Jésus-Christ.",
      KJV: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.",
      'SW-ZAN': "Msijisumbue kwa neno lo lote; bali katika kila neno kwa kusali na kuomba, pamoja na kushukuru, haja zenu na zijulikane na Mungu. Na amani ya Mungu, ipitayo akili zote, itawahifadhi mioyo yenu na nia zenu katika Kristo Yesu.",
      'LN-BIB': "Bomitungisa mpo na eloko moko te ; kasi na makambo nyonso, bosenga Nzambe na losambo mpe na kobondela elongo na botondi. Mpe kimya ya Nzambe oyo eleki mayele nyonso ya moto ekobatela mitema mpe makanisi na bino kati na Klisto Yesu.",
      RVR: "Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias. Y la paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones y vuestros pensamientos en Cristo Jesús."
    },
    themeByLang: {
      fr: "La Paix Surnaturelle de Dieu par la Prière Persévérante",
      en: "God's Supernatural Peace through Earnest Prayer",
      sw: "Amani ya Mungu Inayopita Akili Zote kwa Maombi",
      ln: "Kimya ya Nzambe oyo Eleki Mayele Nyonso",
      es: "La Paz de Dios que Sobrepasa todo Entendimiento"
    }
  },

  // Jour 18: Jean 15:5 - Le cep et les sarments
  {
    id: 18,
    reference: "Jean 15:5",
    referenceByLang: {
      fr: "Jean 15:5",
      en: "John 15:5",
      sw: "Yohana 15:5",
      ln: "Yoane 15:5",
      es: "Juan 15:5"
    },
    text: "Je suis le cep, vous êtes les sarments. Celui qui demeure en moi et en qui je demeure porte beaucoup de fruit, car sans moi vous ne pouvez rien faire.",
    theme: "Demeurer Intimement en Christ pour Porter du Fruit",
    translationsByVersion: {
      LSG: "Je suis le cep, vous êtes les sarments. Celui qui demeure en moi et en qui je demeure porte beaucoup de fruit, car sans moi vous ne pouvez rien faire.",
      KJV: "I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing.",
      'SW-ZAN': "Mimi ni mzabibu, ninyi ni matawi; akaaye ndani yangu nami ndani yake, huyo huzaa sana; maana pasipo mimi ninyi hamwezi kufanya neno lo lote.",
      'LN-BIB': "Ngai nazali nzete ya vino, bino bozali bitape. Moto oyo azali kofanda kati na ngai mpe ngai kati na ye, akobota mbuma mingi ; pamba te soki ngai te bokoki kosala eloko moko te.",
      RVR: "Yo soy la vid, vosotros los pámpanos; el que permanece en mí, y yo en él, éste lleva mucho fruto; porque separados de mí nada podéis hacer."
    },
    themeByLang: {
      fr: "Demeurer Intimement en Christ pour Porter du Fruit",
      en: "Abiding in Christ to Bear Abundant Fruit",
      sw: "Kukaa Ndani ya Kristo na Kuzaa Matunda Mengi",
      ln: "Kovanda Kati na Klisto mpo na Kobota Mbuma Mingi",
      es: "Permanecer en Cristo para Llevar Mucho Fruto"
    }
  },

  // Jour 19: Psaume 27:1 - L'Éternel ma lumière
  {
    id: 19,
    reference: "Psaume 27:1",
    referenceByLang: {
      fr: "Psaume 27:1",
      en: "Psalm 27:1",
      sw: "Zaburi 27:1",
      ln: "Nzembo 27:1",
      es: "Salmos 27:1"
    },
    text: "L'Éternel est ma lumière et mon salut : de qui aurais-je crainte ? L'Éternel est le soutien de ma vie : de qui aurais-je peur ?",
    theme: "L'Assurance Victorieuse et le Secours Infini de Dieu",
    translationsByVersion: {
      LSG: "L'Éternel est ma lumière et mon salut : de qui aurais-je crainte ? L'Éternel est le soutien de ma vie : de qui aurais-je peur ?",
      KJV: "The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?",
      'SW-ZAN': "Bwana ni nuru yangu na wokovu wangu, nimwogope nani? Bwana ni ngome ya uzima wangu, nimhofu nani?",
      'LN-BIB': "Yawe azali pole na ngai mpe lobiko na ngai ; nakobanga nani ? Yawe azali ngubu ya bomoi na ngai ; nani akolengisa ngai ?",
      RVR: "Jehová es mi luz y mi salvación; ¿de quién temeré? Jehová es la fortaleza de mi vida; ¿de quién he de atemorizarme?"
    },
    themeByLang: {
      fr: "L'Assurance Victorieuse et le Secours Infini de Dieu",
      en: "Victorious Assurance in the Lord our Light",
      sw: "Uhakika wa Ushindi: Bwana ni Nuru Yangu",
      ln: "Yawe Azali Pole mpe Lobiko na Ngai",
      es: "La Seguridad Victoriosa en el Señor Nuestra Luz"
    }
  },

  // Jour 20: 2 Timothée 3:16-17 - L'autorité de l'Écriture
  {
    id: 20,
    reference: "2 Timothée 3:16-17",
    referenceByLang: {
      fr: "2 Timothée 3:16-17",
      en: "2 Timothy 3:16-17",
      sw: "2 Timotheo 3:16-17",
      ln: "2 Timote 3:16-17",
      es: "2 Timoteo 3:16-17"
    },
    text: "Toute Écriture est inspirée de Dieu, et utile pour enseigner, pour convaincre, pour corriger, pour instruire dans la justice, afin que l'homme de Dieu soit accompli et propre à toute bonne œuvre.",
    theme: "L'Inspiration Divine et l'Autorité Souveraine de la Bible",
    translationsByVersion: {
      LSG: "Toute Écriture est inspirée de Dieu, et utile pour enseigner, pour convaincre, pour corriger, pour instruire dans la justice, afin que l'homme de Dieu soit accompli et propre à toute bonne œuvre.",
      KJV: "All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness: That the man of God may be perfect, throughly furnished unto all good works.",
      'SW-ZAN': "Kila andiko, lenye pumzi ya Mungu, lafaa kwa mafundisho, na kwa kuwaonya watu makosa yao, na kwa kuwaongoza, na kwa kuwaadibisha katika haki; ili mtu wa Mungu awe kamili, amekamilishwa apate kutenda kila tendo jema.",
      'LN-BIB': "Makomi nyonso epemamaki na Nzambe mpe ezali na ntina mpo na koteya, mpo na kopamela, mpo na kosembola mpe mpo na kobɔkɔla na bosembo, mpo ete moto ya Nzambe akoka na makambo nyonso mpe amibongisa mpo na mosala malamu nyonso.",
      RVR: "Toda la Escritura es inspirada por Dios, y útil para enseñar, para redargüir, para corregir, para instruir en justicia, a fin de que el hombre de Dios sea perfecto, enteramente preparado para toda buena obra."
    },
    themeByLang: {
      fr: "L'Inspiration Divine et l'Autorité Souveraine de la Bible",
      en: "Divine Inspiration and Absolute Authority of Scripture",
      sw: "Pumzi ya Mungu na Mamlaka ya Maandiko",
      ln: "Makomi Nyonso Epemamaki na Nzambe",
      es: "La Inspiración Divina y Autoridad de las Escrituras"
    }
  },

  // Jour 21: 1 Pierre 1:15-16 - Soyez saints
  {
    id: 21,
    reference: "1 Pierre 1:15-16",
    referenceByLang: {
      fr: "1 Pierre 1:15-16",
      en: "1 Peter 1:15-16",
      sw: "1 Petro 1:15-16",
      ln: "1 Petelo 1:15-16",
      es: "1 Pedro 1:15-16"
    },
    text: "Mais, puisque celui qui vous a appelés est saint, vous aussi soyez saints dans toute votre conduite, selon qu'il est écrit : Vous serez saints, car je suis saint.",
    theme: "L'Impératif Divin de la Sainteté dans Toute Notre Marche",
    translationsByVersion: {
      LSG: "Mais, puisque celui qui vous a appelés est saint, vous aussi soyez saints dans toute votre conduite, selon qu'il est écrit : Vous serez saints, car je suis saint.",
      KJV: "But as he which hath called you is holy, so be ye holy in all manner of conversation; Because it is written, Be ye holy; for I am holy.",
      'SW-ZAN': "Bali kama yeye aliyewaita alivyo mtakatifu, nanyi iweni watakatifu katika mwenendo wenu wote; kwa maana imeandikwa, Mtakuwa watakatifu kwa kuwa mimi ni mtakatifu.",
      'LN-BIB': "Kasi lokola Ye oyo abiangaki bino azali Mosanto, bino mpe bozala basanto na etamboli na bino nyonso ; pamba te ekomama : Bozala basanto pamba te Ngai nazali Mosanto.",
      RVR: "Sino, como aquel que os llamó es santo, sed también vosotros santos en toda vuestra manera de vivir; porque escrito está: Sed santos, porque yo soy santo."
    },
    themeByLang: {
      fr: "L'Impératif Divin de la Sainteté dans Toute Notre Marche",
      en: "The Divine Call to Holiness in All Conduct",
      sw: "Wito wa Utakatifu Katika Mwenendo Wote",
      ln: "Bozala Basanto Lokola Ye Azali Mosanto",
      es: "El Imperativo de la Santidad en Toda Nuestra Manera de Vivir"
    }
  },

  // Jour 22: Proverbes 4:23 - Garde ton cœur
  {
    id: 22,
    reference: "Proverbes 4:23",
    referenceByLang: {
      fr: "Proverbes 4:23",
      en: "Proverbs 4:23",
      sw: "Mithali 4:23",
      ln: "Masese 4:23",
      es: "Proverbios 4:23"
    },
    text: "Garde ton cœur plus que toute autre chose, car de lui jaillissent les sources de la vie.",
    theme: "La Garde Jalouse du Cœur Face aux Souillures du Monde",
    translationsByVersion: {
      LSG: "Garde ton cœur plus que toute autre chose, car de lui jaillissent les sources de la vie.",
      KJV: "Keep thy heart with all diligence; for out of it are the issues of life.",
      'SW-ZAN': "Linda moyo wako kuliko yote uyalindayo; maana ndiko zitokako chemchemi za uzima.",
      'LN-BIB': "Batela motema na yo koleka biloko nyonso oyo obateli, pamba te kuna nde euti matangi ya bomoi.",
      RVR: "Sobre toda cosa guardada, guarda tu corazón; porque de él mana la vida."
    },
    themeByLang: {
      fr: "La Garde Jalouse du Cœur Face aux Souillures du Monde",
      en: "Guarding the Heart above All Else",
      sw: "Kulinda Moyo Kuliko Yote Uyalindayo",
      ln: "Kobatela Motema Koleka Biloko Nyonso",
      es: "Guardar el Corazón Sobre Toda Cosa Guardada"
    }
  },

  // Jour 23: Matthieu 5:8 - Les cœurs purs
  {
    id: 23,
    reference: "Matthieu 5:8",
    referenceByLang: {
      fr: "Matthieu 5:8",
      en: "Matthew 5:8",
      sw: "Mathayo 5:8",
      ln: "Matayo 5:8",
      es: "Mateo 5:8"
    },
    text: "Heureux ceux qui ont le cœur pur, car ils verront Dieu !",
    theme: "La Béatitude du Cœur Purifié par le Sang de Christ",
    translationsByVersion: {
      LSG: "Heureux ceux qui ont le cœur pur, car ils verront Dieu !",
      KJV: "Blessed are the pure in heart: for they shall see God.",
      'SW-ZAN': "Heri wenye moyo safi; maana hao watamwona Mungu.",
      'LN-BIB': "Esengo na baoyo bazali na mitema ya pɛto, pamba te bakomona Nzambe !",
      RVR: "Bienaventurados los de limpio corazón, porque ellos verán a Dios."
    },
    themeByLang: {
      fr: "La Béatitude du Cœur Purifié par le Sang de Christ",
      en: "The Blessedness of the Pure in Heart",
      sw: "Heri Wenye Moyo Safi Watamwona Mungu",
      ln: "Esengo na Baoyo Bazali na Mitema ya Pɛto",
      es: "Bienaventurados los Limpios de Corazón"
    }
  },

  // Jour 24: Romains 8:31 - Si Dieu est pour nous
  {
    id: 24,
    reference: "Romains 8:31",
    referenceByLang: {
      fr: "Romains 8:31",
      en: "Romans 8:31",
      sw: "Warumi 8:31",
      ln: "Baroma 8:31",
      es: "Romanos 8:31"
    },
    text: "Que dirons-nous donc à l'égard de ces choses ? Si Dieu est pour nous, qui sera contre nous ?",
    theme: "La Protection Indéfectible de Dieu sur Ses Élus",
    translationsByVersion: {
      LSG: "Que dirons-nous donc à l'égard de ces choses ? Si Dieu est pour nous, qui sera contre nous ?",
      KJV: "What shall we then say to these things? If God be for us, who can be against us?",
      'SW-ZAN': "Tuseme nini basi juu ya mambo haya? Mungu akiwa upande wetu, ni nani aliye juu yetu?",
      'LN-BIB': "Tokoloba nini lisusu na makambo oyo ? Soki Nzambe azali na ngambo na biso, nani akoki kotelemela biso ?",
      RVR: "¿Qué, pues, diremos a esto? Si Dios es por nosotros, ¿quién contra nosotros?"
    },
    themeByLang: {
      fr: "La Protection Indéfectible de Dieu sur Ses Élus",
      en: "The Unfailing Protection of God for His Chosen",
      sw: "Mungu Akiwa Upande Wetu, Nani Aliye Juu Yetu?",
      ln: "Soki Nzambe Azali na Biso, Nani Akotelemela Biso?",
      es: "Si Dios es por Nosotros, ¿Quién contra Nosotros?"
    }
  },

  // Jour 25: 1 Jean 5:4 - La victoire de la foi
  {
    id: 25,
    reference: "1 Jean 5:4",
    referenceByLang: {
      fr: "1 Jean 5:4",
      en: "1 John 5:4",
      sw: "1 Yohana 5:4",
      ln: "1 Yoane 5:4",
      es: "1 Juan 5:4"
    },
    text: "Parce que tout ce qui est né de Dieu triomphe du monde; et la victoire qui triomphe du monde, c'est notre foi.",
    theme: "La Foi Authentique comme Arme Triomphante sur le Monde",
    translationsByVersion: {
      LSG: "Parce que tout ce qui est né de Dieu triomphe du monde; et la victoire qui triomphe du monde, c'est notre foi.",
      KJV: "For whatsoever is born of God overcometh the world: and this is the victory that overcometh the world, even our faith.",
      'SW-ZAN': "Kwa maana kila kitu kilichozaliwa na Mungu huushinda ulimwengu; na huku ndiko kushinda kuushindako ulimwengu, hiyo imani yetu.",
      'LN-BIB': "Pamba te moto nyonso oyo abotami na Nzambe alongaka mokili ; mpe eloko oyo elongaka mokili ezali kondima na biso.",
      RVR: "Porque todo lo que es nacido de Dios vence al mundo; y esta es la victoria que ha vencido al mundo, nuestra fe."
    },
    themeByLang: {
      fr: "La Foi Authentique comme Arme Triomphante sur le Monde",
      en: "Faith as the Triumphant Victory over the World",
      sw: "Kushinda Ulimwengu Kupitia Imani Yetu",
      ln: "Kondima Oyo Elongaka Mokili",
      es: "La Fe como Victoria que Vence al Mundo"
    }
  },

  // Jour 26: Jérémie 29:13 - Chercher de tout cœur
  {
    id: 26,
    reference: "Jérémie 29:13",
    referenceByLang: {
      fr: "Jérémie 29:13",
      en: "Jeremiah 29:13",
      sw: "Yeremia 29:13",
      ln: "Yirimia 29:13",
      es: "Jeremías 29:13"
    },
    text: "Vous me chercherez, et vous me trouverez, si vous me cherchez de tout votre cœur.",
    theme: "La Soif Ardente et la Rencontre Profonde avec l'Éternel",
    translationsByVersion: {
      LSG: "Vous me chercherez, et vous me trouverez, si vous me cherchez de tout votre cœur.",
      KJV: "And ye shall seek me, and find me, when ye shall search for me with all your heart.",
      'SW-ZAN': "Nanyi mtanitafuta na kuniona, mtakaponitafuta kwa moyo wenu wote.",
      'LN-BIB': "Bokoluka ngai mpe bokomona ngai, soki bozali koluka ngai na motema na bino mobimba.",
      RVR: "Y me buscaréis y me hallaréis, porque me buscaréis de todo vuestro corazón."
    },
    themeByLang: {
      fr: "La Soif Ardente et la Rencontre Profonde avec l'Éternel",
      en: "Seeking the Lord with All Your Heart",
      sw: "Kumtafuta Bwana kwa Moyo Wote",
      ln: "Koluka Yawe na Motema Mobimba",
      es: "Buscar al Señor de Todo Corazón"
    }
  },

  // Jour 27: Apocalypse 22:20 - Maranatha
  {
    id: 27,
    reference: "Apocalypse 22:20",
    referenceByLang: {
      fr: "Apocalypse 22:20",
      en: "Revelation 22:20",
      sw: "Ufunuo 22:20",
      ln: "Emoniseli 22:20",
      es: "Apocalipsis 22:20"
    },
    text: "Celui qui atteste ces choses dit : Oui, je viens bientôt. Amen ! Viens, Seigneur Jésus !",
    theme: "L'Espérance Radieuse et le Cri de l'Épouse : Maranatha",
    translationsByVersion: {
      LSG: "Celui qui atteste ces choses dit : Oui, je viens bientôt. Amen ! Viens, Seigneur Jésus !",
      KJV: "He which testifieth these things saith, Surely I come quickly. Amen. Even so, come, Lord Jesus.",
      'SW-ZAN': "Yeye anayeshuhudia haya asema, Ndiyo; naja upesi. Amina; na uje, Bwana Yesu.",
      'LN-BIB': "Ye oyo azali kotatola makambo oyo alobi : Iyo, nazali koya noki ! Amen ! Yaka, Nkolo Yesu !",
      RVR: "El que da testimonio de estas cosas dice: Ciertamente vengo en breve. Amén; sí, ven, Señor Jesús."
    },
    themeByLang: {
      fr: "L'Espérance Radieuse et le Cri de l'Épouse : Maranatha",
      en: "Radiant Hope and the Bride's Cry: Maranatha",
      sw: "Tumaini Tukufu na Kilio cha Bibi-arusi: Maranatha",
      ln: "Elikya ya Nkembo : Yaka Nkolo Yesu !",
      es: "La Esperanza Radiante: ¡Ven, Señor Jesús!"
    }
  },

  // Jour 28: Psaume 91:1-2 - Sous l'abri du Très-Haut
  {
    id: 28,
    reference: "Psaume 91:1-2",
    referenceByLang: {
      fr: "Psaume 91:1-2",
      en: "Psalm 91:1-2",
      sw: "Zaburi 91:1-2",
      ln: "Nzembo 91:1-2",
      es: "Salmos 91:1-2"
    },
    text: "Celui qui demeure sous l'abri du Très-Haut repose à l'ombre du Tout-Puissant. Je dis à l'Éternel : Mon refuge et ma forteresse, mon Dieu en qui je me confie !",
    theme: "L'Abri Secret du Tout-Puissant et le Refuge Assuré",
    translationsByVersion: {
      LSG: "Celui qui demeure sous l'abri du Très-Haut repose à l'ombre du Tout-Puissant. Je dis à l'Éternel : Mon refuge et ma forteresse, mon Dieu en qui je me confie !",
      KJV: "He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty. I will say of the LORD, He is my refuge and my fortress: my God; in him will I trust.",
      'SW-ZAN': "Akaaye mahali pa siri pake Aliye juu atakaa katika uvuli wake Mwenyezi. Nitasema, Bwana ndiye kimbilio langu na ngome yangu, Mungu wangu nitakayemtumaini.",
      'LN-BIB': "Moto oyo afandaka na esika ya kobombana ya Oyo-Aleki-Likolo akolala na nse ya elili ya Nkolo-Oyo-Akoki-Nyonso. Nalobi na Yawe : Yo ozali esika na ngai ya kobombana mpe ngubu na ngai, Nzambe na ngai oyo natielaka motema !",
      RVR: "El que habita al abrigo del Altísimo morará bajo la sombra del Omnipotente. Diré yo a Jehová: Esperanza mía, y castillo mío; mi Dios, en quien confiaré."
    },
    themeByLang: {
      fr: "L'Abri Secret du Tout-Puissant et le Refuge Assuré",
      en: "Abiding in the Secret Place of the Most High",
      sw: "Kukaa Mahali pa Siri Pake Aliye Juu",
      ln: "Kofanda na Esika ya Kobombana ya Oyo-Aleki-Likolo",
      es: "Habitar al Abrigo del Altísimo"
    }
  },

  // Jour 29: 1 Corinthiens 10:13 - Fidélité dans l'épreuve
  {
    id: 29,
    reference: "1 Corinthiens 10:13",
    referenceByLang: {
      fr: "1 Corinthiens 10:13",
      en: "1 Corinthians 10:13",
      sw: "1 Wakorintho 10:13",
      ln: "1 Bakolinto 10:13",
      es: "1 Corintios 10:13"
    },
    text: "Aucune tentation ne vous est survenue qui n'ait été humaine, et Dieu, qui est fidèle, ne permettra pas que vous soyez tentés au-delà de vos forces; mais avec la tentation il préparera aussi le moyen d'en sortir...",
    theme: "La Fidélité de Dieu au Creuset de l'Épreuve",
    translationsByVersion: {
      LSG: "Aucune tentation ne vous est survenue qui n'ait été humaine, et Dieu, qui est fidèle, ne permettra pas que vous soyez tentés au-delà de vos forces; mais avec la tentation il préparera aussi le moyen d'en sortir...",
      KJV: "There hath no temptation taken you but such as is common to man: but God is faithful, who will not suffer you to be tempted above that ye are able; but will with the temptation also make a way to escape...",
      'SW-ZAN': "Jaribu halikuwapata ninyi, isipokuwa lililo kawaida ya wanadamu; ila Mungu ni mwaminifu; ambaye hatawaacha mjaribiwe kupita mwezavyo; lakini pamoja na lile jaribu atafanya na mlango wa kutokea...",
      'LN-BIB': "Mekameka moko te ekweyeli bino oyo ezali likolo ya makoki ya moto ; Nzambe azali sembo, akotika bino te komekama koleka makoki na bino, kasi elongo na komekama yango akobimisela bino nzela ya kobima...",
      RVR: "No os ha sobrevenido ninguna tentación que no sea humana; pero fiel es Dios, que no os dejará ser tentados más de lo que podéis resistir, sino que dará también juntamente con la tentación la salida..."
    },
    themeByLang: {
      fr: "La Fidélité de Dieu au Creuset de l'Épreuve",
      en: "God's Faithfulness in the Furnace of Trial",
      sw: "Uaminifu wa Mungu Katika Majaribu",
      ln: "Bosembo ya Nzambe Kati na Momekano",
      es: "La Fidelidad de Dios en Medio de la Prueba"
    }
  },

  // Jour 30: Actes 1:8 - La puissance du Saint-Esprit
  {
    id: 30,
    reference: "Actes 1:8",
    referenceByLang: {
      fr: "Actes 1:8",
      en: "Acts 1:8",
      sw: "Matendo 1:8",
      ln: "Misala 1:8",
      es: "Hechos 1:8"
    },
    text: "Mais vous recevrez une puissance, le Saint-Esprit survenant sur vous, et vous serez mes témoins à Jérusalem, dans toute la Judée, dans la Samarie, et jusqu'aux extrémités de la terre.",
    theme: "La Puissance du Saint-Esprit pour le Témoignage Victorieux",
    translationsByVersion: {
      LSG: "Mais vous recevrez une puissance, le Saint-Esprit survenant sur vous, et vous serez mes témoins à Jérusalem, dans toute la Judée, dans la Samarie, et jusqu'aux extrémités de la terre.",
      KJV: "But ye shall receive power, after that the Holy Ghost is come upon you: and ye shall be witnesses unto me both in Jerusalem, and in all Judaea, and in Samaria, and unto the uttermost part of the earth.",
      'SW-ZAN': "Lakini mtapokea nguvu, akiisha kuwajilia juu yenu Roho Mtakatifu; nanyi mtakuwa mashahidi wangu katika Yerusalemu, na katika Uyahudi wote, na Samaria, na hata mwisho wa nchi.",
      'LN-BIB': "Kasi bokozwa nguya ntango Molimo Mosanto akokitela bino, mpe bokozala batatoli na ngai na Yerusalemi, na Yudea mobimba, na Samaria mpe tii na suka ya mokili.",
      RVR: "Pero recibiréis poder, cuando haya venido sobre vosotros el Espíritu Santo, y me seréis testigos en Jerusalén, en toda Judea, en Samaria, y hasta lo último de la tierra."
    },
    themeByLang: {
      fr: "La Puissance du Saint-Esprit pour le Témoignage Victorieux",
      en: "The Holy Spirit's Power for Victorious Witness",
      sw: "Nguvu ya Roho Mtakatifu kwa Ushuhuda Wenye Ushindi",
      ln: "Nguya ya Molimo Mosanto mpo na Kotatola",
      es: "El Poder del Espíritu Santo para Testificar con Victoria"
    }
  },

  // Jour 31: Jude 1:24-25 - Préservés sans tache
  {
    id: 31,
    reference: "Jude 1:24-25",
    referenceByLang: {
      fr: "Jude 1:24-25",
      en: "Jude 1:24-25",
      sw: "Yuda 1:24-25",
      ln: "Yuda 1:24-25",
      es: "Judas 1:24-25"
    },
    text: "Or, à celui qui peut vous préserver de toute chute et vous faire paraître devant sa gloire irrépréhensibles et dans l'allégresse, à Dieu seul notre Sauveur, soient gloire et force pour toujours ! Amen.",
    theme: "La Garde Infaillible de Dieu pour Nous Présenter Sans Tache",
    translationsByVersion: {
      LSG: "Or, à celui qui peut vous préserver de toute chute et vous faire paraître devant sa gloire irrépréhensibles et dans l'allégresse, à Dieu seul notre Sauveur, soient gloire et force pour toujours ! Amen.",
      KJV: "Now unto him that is able to keep you from falling, and to present you faultless before the presence of his glory with exceeding joy, To the only wise God our Saviour, be glory and majesty, dominion and power, both now and ever. Amen.",
      'SW-ZAN': "Yeye awezaye kuwalinda ninyi msijikwae, na kuwasimamisha mbele ya utukufu wake bila hila katika furaha kuu, Yeye aliye Mungu pekee, Mwokozi wetu... uwe utukufu, na ukuu, na uwezo, na mamlaka, tangu milele, na sasa, na hata milele. Amina.",
      'LN-BIB': "Bongo epai na Ye oyo akoki kobatela bino ete bokwea te, mpe kotelemisa bino liboso ya nkembo na Ye kozanga mbeba na esengo monene, epai na Nzambe moko kaka Mobikisi na biso, nkembo mpe nguya ezala ya Ye seko na seko ! Amen.",
      RVR: "Y a aquel que es poderoso para guardaros sin caída, y presentaros sin mancha delante de su gloria con gran alegría, al único y sabio Dios, nuestro Salvador, sea gloria y majestad, imperio y potencia, ahora y por todos los siglos. Amén."
    },
    themeByLang: {
      fr: "La Garde Infaillible de Dieu pour Nous Présenter Sans Tache",
      en: "God's Infallible Keeping Power to Present Us Blameless",
      sw: "Ulinzi Usio na Shaka wa Mungu Kutulinda Tusijikwae",
      ln: "Bokebi ya Nzambe mpo na Kobatela Biso Kozanga Mbeba",
      es: "El Poder de Dios para Guardarnos sin Caída"
    }
  }
];

/**
 * Calculates current 24h rotating verse index deterministically based on date (UTC/Day).
 */
export function getDailyVerseForDate(date: Date = new Date()): DailyVerseItem {
  const year = date.getUTCFullYear();
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const index = Math.abs(dayOfYear) % ROTATING_DAILY_VERSES.length;
  return ROTATING_DAILY_VERSES[index];
}

/**
 * Resolves the localized scripture, reference, theme and active Bible version
 * according to the selected UI language or explicitly requested Bible version.
 */
export function getLocalizedDailyVerse(
  verseItem: DailyVerseItem,
  language: string = 'fr',
  explicitVersion?: BibleVersionId
): {
  reference: string;
  text: string;
  theme: string;
  versionId: BibleVersionId;
  versionName: string;
  availableVersions: { id: string; label: string; text: string }[];
} {
  const langKey = language.toLowerCase();
  const targetVersion: BibleVersionId = explicitVersion || (LANGUAGE_TO_DEFAULT_BIBLE_VERSION[langKey] || 'LSG');

  // Scripture text matching target version or fallback
  let text = verseItem.translationsByVersion[targetVersion] ||
    (langKey === 'en' ? verseItem.translationsByVersion.KJV : undefined) ||
    (langKey === 'sw' ? verseItem.translationsByVersion['SW-ZAN'] : undefined) ||
    (langKey === 'ln' ? verseItem.translationsByVersion['LN-BIB'] : undefined) ||
    (langKey === 'es' || langKey === 'pt' ? (verseItem.translationsByVersion.RVR || verseItem.translationsByVersion.LSG) : undefined) ||
    (langKey === 'de' ? (verseItem.translationsByVersion.KJV || verseItem.translationsByVersion.LSG) : undefined) ||
    (langKey === 'it' ? verseItem.translationsByVersion.LSG : undefined) ||
    (langKey === 'kg' ? (verseItem.translationsByVersion['LN-BIB'] || verseItem.translationsByVersion['SW-ZAN']) : undefined) ||
    (langKey === 'lu' ? (verseItem.translationsByVersion['SW-ZAN'] || verseItem.translationsByVersion['LN-BIB']) : undefined) ||
    verseItem.translationsByVersion.LSG ||
    verseItem.text;

  // Localized reference (e.g. "1 Peter 5:10", "1 Petro 5:10", "1 Petelo 5:10", "1 Pedro 5:10", "1. Petrus 5:10")
  let reference = verseItem.referenceByLang[langKey];
  if (!reference) {
    const parts = verseItem.reference.match(/^(\d?\s*[^\d]+)\s+(\d+:\d+.*)$/);
    if (parts) {
      const bookPrefix = parts[1].trim();
      const versePart = parts[2].trim();
      const book = BIBLE_BOOKS.find(b => 
        b.frenchName.toLowerCase() === bookPrefix.toLowerCase() ||
        b.name.toLowerCase() === bookPrefix.toLowerCase()
      );
      if (book) {
        reference = `${getLocalizedBookName(book, langKey)} ${versePart}`;
      }
    }
  }
  if (!reference) {
    reference = verseItem.reference;
  }

  // Localized theme
  let theme = verseItem.themeByLang[langKey];
  if (!theme) {
    if (langKey === 'pt') theme = verseItem.themeByLang.es || verseItem.theme;
    else if (langKey === 'de') theme = verseItem.themeByLang.en || verseItem.theme;
    else if (langKey === 'it') theme = verseItem.theme;
    else if (langKey === 'kg') theme = verseItem.themeByLang.ln || verseItem.theme;
    else if (langKey === 'lu') theme = verseItem.themeByLang.sw || verseItem.theme;
    else theme = verseItem.theme;
  }

  const versionName = BIBLE_VERSION_LABELS[targetVersion] || targetVersion;

  // List of all available translations for this verse
  const availableVersions: { id: string; label: string; text: string }[] = [];
  if (verseItem.translationsByVersion.LSG) {
    availableVersions.push({ id: 'LSG', label: 'LSG (Français)', text: verseItem.translationsByVersion.LSG });
  }
  if (verseItem.translationsByVersion.KJV) {
    availableVersions.push({ id: 'KJV', label: 'KJV (English)', text: verseItem.translationsByVersion.KJV });
  }
  if (verseItem.translationsByVersion['SW-ZAN']) {
    availableVersions.push({ id: 'SW-ZAN', label: 'SW-ZAN (Kiswahili)', text: verseItem.translationsByVersion['SW-ZAN'] });
  }
  if (verseItem.translationsByVersion['LN-BIB']) {
    availableVersions.push({ id: 'LN-BIB', label: 'LN-BIB (Lingála)', text: verseItem.translationsByVersion['LN-BIB'] });
  }
  if (verseItem.translationsByVersion.RVR) {
    availableVersions.push({ id: 'RVR', label: 'RVR (Español)', text: verseItem.translationsByVersion.RVR });
  }

  return {
    reference,
    text,
    theme,
    versionId: targetVersion,
    versionName,
    availableVersions
  };
}

/**
 * Gets or rotates verse in localStorage every 24 hours.
 * Uses key 'bdh_daily_verse_date' with format YYYY-MM-DD.
 */
export function getAutoRotatedDailyVerse(
  language: string = 'fr',
  explicitVersion?: BibleVersionId
): {
  verse: DailyVerseItem;
  localized: ReturnType<typeof getLocalizedDailyVerse>;
  dayKey: string;
  isNewDay: boolean;
} {
  const now = new Date();
  const dayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  let isNewDay = false;
  try {
    const savedDate = localStorage.getItem('bdh_daily_verse_date');
    if (savedDate !== dayKey) {
      localStorage.setItem('bdh_daily_verse_date', dayKey);
      isNewDay = true;
    }
  } catch {
    // Local storage access error fallback
  }

  const verse = getDailyVerseForDate(now);
  const localized = getLocalizedDailyVerse(verse, language, explicitVersion);

  return { verse, localized, dayKey, isNewDay };
}
