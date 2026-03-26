// Latin dictionary for OCR correction (edit-distance matching)
// Contains common Latin word forms a German student would encounter in textbook vocabulary lists
const LATIN_DICT = new Set([

  // ── Grammatical markers (as they appear in vocab lists) ──
  'm.', 'f.', 'n.', 'adj.', 'adv.', 'konj.', 'präp.', 'pron.',
  'subst.', 'verb.', 'interj.', 'num.', 'part.', 'inf.', 'gen.',
  'dat.', 'akk.', 'abl.', 'nom.', 'vok.', 'lok.',

  // ── Prepositions ──
  'in', 'ad', 'ex', 'de', 'cum', 'per', 'pro', 'sub', 'ante',
  'post', 'inter', 'trans', 'super', 'contra', 'sine', 'apud',
  'ob', 'propter', 'circa', 'circum', 'ultra', 'infra', 'supra',
  'prae', 'praeter', 'prope', 'iuxta', 'secundum', 'versus',
  'abs', 'erga', 'extra', 'intra',

  // ── Conjunctions ──
  'et', 'sed', 'aut', 'vel', 'atque', 'ac', 'neque', 'nec',
  'que', 'nam', 'enim', 'autem', 'tamen', 'igitur', 'ergo',
  'itaque', 'quoque', 'etiam', 'iam', 'nunc', 'tum', 'ut',
  'ne', 'si', 'nisi', 'quod', 'quia', 'quoniam', 'cum',
  'dum', 'donec', 'postquam', 'antequam', 'priusquam', 'ubi',
  'quando', 'quamquam', 'quamvis', 'etsi', 'tamquam', 'quasi',

  // ── Adverbs ──
  'non', 'iam', 'nunc', 'tum', 'tunc', 'sic', 'ita', 'tam',
  'vero', 'quidem', 'quoque', 'etiam', 'semper', 'saepe',
  'numquam', 'nusquam', 'ubique', 'statim', 'subito', 'inde',
  'hinc', 'illic', 'ibi', 'ubi', 'hic', 'illic', 'huc',
  'eo', 'quo', 'unde', 'alias', 'aliter', 'certe', 'forte',
  'forsitan', 'fortasse', 'fere', 'ferme', 'paene', 'prope',
  'omnino', 'plane', 'prorsus', 'ita', 'sic', 'frustra',
  'gratis', 'gratiis', 'sponte', 'repente', 'tandem', 'denique',
  'demum', 'postremo', 'primum', 'primo', 'deinde', 'inde',
  'postea', 'ante', 'antea', 'interim', 'interea', 'interim',
  'simul', 'semel', 'bis', 'ter', 'multo', 'paulo',
  'magis', 'maxime', 'minus', 'minime', 'plus', 'plurimum',
  'potius', 'potissimum', 'praecipue', 'praesertim', 'imprimis',
  'nimis', 'nimium', 'satis', 'parum', 'vix', 'aegre',

  // ── Pronouns ──
  'ego', 'tu', 'nos', 'vos', 'is', 'ea', 'id',
  'hic', 'haec', 'hoc', 'ille', 'illa', 'illud',
  'iste', 'ista', 'istud', 'ipse', 'ipsa', 'ipsum',
  'idem', 'eadem', 'idem', 'qui', 'quae', 'quod',
  'quis', 'quid', 'aliquis', 'aliquid', 'aliqua',
  'quisque', 'quaeque', 'quidque', 'quisquam', 'quicquam',
  'nemo', 'nihil', 'nullus', 'nulla', 'nullum',
  'omnis', 'omne', 'omnes', 'omnia',
  'alius', 'alia', 'aliud', 'alter', 'altera', 'alterum',
  'uterque', 'utraque', 'utrumque',
  'mei', 'tui', 'sui', 'nostri', 'vestri',
  'mihi', 'tibi', 'sibi', 'nobis', 'vobis',
  'me', 'te', 'se', 'nos', 'vos',
  'meus', 'mea', 'meum', 'tuus', 'tua', 'tuum',
  'suus', 'sua', 'suum', 'noster', 'nostra', 'nostrum',
  'vester', 'vestra', 'vestrum', 'eius', 'eos', 'eas',
  'eum', 'eam', 'ei', 'eae', 'eis', 'eorum', 'earum',

  // ── Numbers ──
  'unus', 'una', 'unum', 'duo', 'duae', 'tres', 'tria',
  'quattuor', 'quinque', 'sex', 'septem', 'octo', 'novem',
  'decem', 'undecim', 'duodecim', 'viginti', 'triginta',
  'centum', 'mille', 'primus', 'prima', 'primum',
  'secundus', 'secunda', 'secundum', 'tertius', 'tertia', 'tertium',
  'quartus', 'quarta', 'quartum', 'quintus', 'quinta', 'quintum',
  'sextus', 'septimus', 'octavus', 'nonus', 'decimus',
  'ultimus', 'ultima', 'ultimum',

  // ══════════════════════════════════════════════════════════
  // VERBS – Principal Parts + Common Forms
  // ══════════════════════════════════════════════════════════

  // amare (1st conjugation model)
  'amare', 'amo', 'amas', 'amat', 'amamus', 'amatis', 'amant',
  'amavi', 'amavisti', 'amavit', 'amavimus', 'amavistis', 'amaverunt',
  'amaveram', 'amaveriam', 'amavero', 'amaverim', 'amavisset',
  'amatum', 'amatus', 'amata', 'amati', 'amatae', 'amando',
  'amabam', 'amabas', 'amabat', 'amabamus', 'amabatis', 'amabant',
  'amabo', 'amabis', 'amabit', 'amabimus', 'amabitis', 'amabunt',
  'amem', 'ames', 'amet', 'amemus', 'ametis', 'ament',
  'amarem', 'amares', 'amaret', 'amaremus', 'amaretis', 'amarent',
  'amaverim', 'amaveris', 'amaverit', 'amaverimus', 'amaveritis', 'amaverint',
  'amaverissem', 'amavisse', 'amans', 'amantis', 'amantibus',

  // laudare
  'laudare', 'laudo', 'laudas', 'laudat', 'laudamus', 'laudatis', 'laudant',
  'laudavi', 'laudavisti', 'laudavit', 'laudaverunt', 'laudatum',
  'laudatus', 'laudata', 'laudati', 'laudatae', 'laudando',
  'laudabam', 'laudabo', 'laudem', 'laudarem',

  // vocare
  'vocare', 'voco', 'vocas', 'vocat', 'vocamus', 'vocatis', 'vocant',
  'vocavi', 'vocavit', 'vocaverunt', 'vocatum', 'vocatus', 'vocata',
  'vocabam', 'vocabo', 'vocem', 'vocarem',

  // portare
  'portare', 'porto', 'portas', 'portat', 'portamus', 'portatis', 'portant',
  'portavi', 'portavit', 'portaverunt', 'portatum', 'portatus',
  'portabam', 'portabo', 'portem', 'portarem',

  // narrare
  'narrare', 'narro', 'narras', 'narrat', 'narramus', 'narratis', 'narrant',
  'narravi', 'narravit', 'narraverunt', 'narratum', 'narratus', 'narrata',
  'narrabam', 'narrabo', 'narrem', 'narrarem',

  // habitare
  'habitare', 'habito', 'habitas', 'habitat', 'habitamus', 'habitatis', 'habitant',
  'habitavi', 'habitavit', 'habitaverunt', 'habitatum', 'habitatus',
  'habitabam', 'habitabo', 'habitem', 'habitarem',

  // parare
  'parare', 'paro', 'paras', 'parat', 'paramus', 'paratis', 'parant',
  'paravi', 'paravit', 'paraverunt', 'paratum', 'paratus',
  'parabam', 'parabo', 'parem', 'pararem',

  // spectare
  'spectare', 'specto', 'spectas', 'spectat', 'spectamus', 'spectatis', 'spectant',
  'spectavi', 'spectavit', 'spectaverunt', 'spectatum', 'spectatus',
  'spectabam', 'spectabo', 'spectem', 'spectarem',

  // stare
  'stare', 'sto', 'stas', 'stat', 'stamus', 'statis', 'stant',
  'steti', 'stetit', 'steterunt', 'statum',
  'stabam', 'stabo', 'stem', 'starem',

  // dare
  'dare', 'do', 'das', 'dat', 'damus', 'datis', 'dant',
  'dedi', 'dedisti', 'dedit', 'dedimus', 'dedistis', 'dederunt',
  'datum', 'datus', 'data',
  'dabam', 'dabo', 'dem', 'darem', 'dando',

  // putare
  'putare', 'puto', 'putas', 'putat', 'putamus', 'putatis', 'putant',
  'putavi', 'putavit', 'putaverunt', 'putatum',
  'putabam', 'putabo', 'putem', 'putarem',

  // optare
  'optare', 'opto', 'optas', 'optat', 'optamus', 'optatis', 'optant',
  'optavi', 'optavit', 'optaverunt', 'optatum',

  // cogitare
  'cogitare', 'cogito', 'cogitas', 'cogitat', 'cogitamus', 'cogitatis', 'cogitant',
  'cogitavi', 'cogitavit', 'cogitaverunt', 'cogitatum',
  'cogitabam', 'cogitabo', 'cogitem', 'cogitarem',

  // errare
  'errare', 'erro', 'erras', 'errat', 'erramus', 'erratis', 'errant',
  'erravi', 'erravit', 'erraverunt', 'erratum',

  // laborare
  'laborare', 'laboro', 'laboras', 'laborat', 'laboramus', 'laboratis', 'laborant',
  'laboravi', 'laboravit', 'laboraverunt', 'laboratum',
  'laborabam', 'laborabo', 'laborem', 'laborarem',

  // orare
  'orare', 'oro', 'oras', 'orat', 'oramus', 'oratis', 'orant',
  'oravi', 'oravit', 'oraverunt', 'oratum',

  // liberare
  'liberare', 'libero', 'liberas', 'liberat', 'liberamus', 'liberatis', 'liberant',
  'liberavi', 'liberavit', 'liberaverunt', 'liberatum', 'liberatus',

  // nuntiare
  'nuntiare', 'nuntio', 'nuntias', 'nuntiat', 'nuntiamus', 'nuntiatis', 'nuntiant',
  'nuntiavi', 'nuntiavit', 'nuntiaverunt', 'nuntiatum',
  'nuntiabam', 'nuntiabo',

  // servare
  'servare', 'servo', 'servas', 'servat', 'servamus', 'servatis', 'servant',
  'servavi', 'servavit', 'servaverunt', 'servatum', 'servatus',

  // superare
  'superare', 'supero', 'superas', 'superat', 'superamus', 'superatis', 'superant',
  'superavi', 'superavit', 'superaverunt', 'superatum',

  // oppugnare
  'oppugnare', 'oppugno', 'oppugnas', 'oppugnat', 'oppugnamus', 'oppugnatis', 'oppugnant',
  'oppugnavi', 'oppugnavit', 'oppugnaverunt', 'oppugnatum',

  // navigare
  'navigare', 'navigo', 'navigas', 'navigat', 'navigamus', 'navigatis', 'navigant',
  'navigavi', 'navigavit', 'navigaverunt', 'navigatum',

  // pugnare
  'pugnare', 'pugno', 'pugnas', 'pugnat', 'pugnamus', 'pugnatis', 'pugnant',
  'pugnavi', 'pugnavit', 'pugnaverunt', 'pugnatum',

  // rogare
  'rogare', 'rogo', 'rogas', 'rogat', 'rogamus', 'rogatis', 'rogant',
  'rogavi', 'rogavit', 'rogaverunt', 'rogatum',

  // occupare
  'occupare', 'occupo', 'occupas', 'occupat', 'occupamus', 'occupatis', 'occupant',
  'occupavi', 'occupavit', 'occupaverunt', 'occupatum',

  // temptare
  'temptare', 'tempto', 'temptas', 'temptat', 'temptamus', 'temptatis', 'temptant',
  'temptavi', 'temptavit', 'temptaverunt', 'temptatum',

  // appellare
  'appellare', 'appello', 'appellas', 'appellat', 'appellamus', 'appellatis', 'appellant',
  'appellavi', 'appellavit', 'appellaverunt', 'appellatum',

  // iudicare
  'iudicare', 'iudico', 'iudicas', 'iudicat', 'iudicamus', 'iudicatis', 'iudicant',
  'iudicavi', 'iudicavit', 'iudicaverunt', 'iudicatum',

  // dedicare
  'dedicare', 'dedico', 'dedicas', 'dedicat', 'dedicamus', 'dedicatis', 'dedicant',
  'dedicavi', 'dedicavit', 'dedicaverunt', 'dedicatum',

  // aedificare
  'aedificare', 'aedifico', 'aedificas', 'aedificat', 'aedificamus', 'aedificatis', 'aedificant',
  'aedificavi', 'aedificavit', 'aedificaverunt', 'aedificatum',

  // imperare
  'imperare', 'impero', 'imperas', 'imperat', 'imperamus', 'imperatis', 'imperant',
  'imperavi', 'imperavit', 'imperaverunt', 'imperatum',

  // recreare
  'recreare', 'recreo', 'recreas', 'recreat', 'recreamus', 'recreatis', 'recreant',
  'recreavi', 'recreavit', 'recreaverunt', 'recreatum',

  // confirmmare / confirmare
  'confirmare', 'confirmo', 'confirmas', 'confirmat', 'confirmamus', 'confirmatis', 'confirmant',
  'confirmavi', 'confirmavit', 'confirmaverunt', 'confirmatum',

  // mutare
  'mutare', 'muto', 'mutas', 'mutat', 'mutamus', 'mutatis', 'mutant',
  'mutavi', 'mutavit', 'mutaverunt', 'mutatum',

  // iuvare
  'iuvare', 'iuvo', 'iuvas', 'iuvat', 'iuvamus', 'iuvatis', 'iuvant',
  'iuvi', 'iuvit', 'iuverunt', 'iutum',

  // monstrare
  'monstrare', 'monstro', 'monstras', 'monstrat', 'monstramus', 'monstratis', 'monstrant',
  'monstravi', 'monstravit', 'monstraverunt', 'monstratum',

  // minare / minari / minarе
  'minari', 'minor', 'minaris', 'minatur', 'minamur', 'minamini', 'minantur',

  // equitare
  'equitare', 'equito', 'equitas', 'equitat', 'equitamus', 'equitatis', 'equitant',
  'equitavi', 'equitavit', 'equitaverunt',

  // ── 2nd Conjugation (habere model) ──
  'habere', 'habeo', 'habes', 'habet', 'habemus', 'habetis', 'habent',
  'habui', 'habuisti', 'habuit', 'habuimus', 'habuistis', 'habuerunt',
  'habitum', 'habitus', 'habita',
  'habebam', 'habebas', 'habebat', 'habebamus', 'habebatis', 'habebant',
  'habebo', 'habebis', 'habebit', 'habebimus', 'habebitis', 'habebunt',
  'habeam', 'habeas', 'habeat', 'habeamus', 'habeatis', 'habeant',
  'haberem', 'haberes', 'haberet', 'haberemus', 'haberetis', 'haberent',
  'habuerim', 'habueris', 'habuerit', 'habuerimus', 'habueritis', 'habuerint',
  'habuissem', 'habuisse', 'habens', 'habentis', 'habendo',

  // monere
  'monere', 'moneo', 'mones', 'monet', 'monemus', 'monetis', 'monent',
  'monui', 'monuit', 'monuerunt', 'monitum', 'monitus',
  'monebam', 'monebo', 'moneam', 'monerem',

  // videre
  'videre', 'video', 'vides', 'videt', 'videmus', 'videtis', 'vident',
  'vidi', 'vidisti', 'vidit', 'vidimus', 'vidistis', 'viderunt',
  'visum', 'visus', 'visa',
  'videbam', 'videbas', 'videbat', 'videbamus', 'videbatis', 'videbant',
  'videbo', 'videbis', 'videbit', 'videbimus', 'videbitis', 'videbunt',
  'videam', 'videas', 'videat', 'videamus', 'videatis', 'videant',
  'viderem', 'videres', 'videret', 'videremus', 'videretis', 'viderent',
  'viderim', 'vidisse', 'videns', 'videntis', 'videndo',

  // terrere
  'terrere', 'terreo', 'terres', 'terret', 'terremus', 'terretis', 'terrent',
  'terrui', 'terruit', 'terruerunt', 'territum', 'territus',
  'terrebam', 'terrebo', 'terream', 'terrerem',

  // docere
  'docere', 'doceo', 'doces', 'docet', 'docemus', 'docetis', 'docent',
  'docui', 'docuit', 'docuerunt', 'doctum', 'doctus', 'docta',
  'docebam', 'docebo', 'doceam', 'docerem',

  // movere
  'movere', 'moveo', 'moves', 'movet', 'movemus', 'movetis', 'movent',
  'movi', 'movit', 'moverunt', 'motum', 'motus', 'mota',
  'movebam', 'movebo', 'moveam', 'moverem',

  // tenere
  'tenere', 'teneo', 'tenes', 'tenet', 'tenemus', 'tenetis', 'tenent',
  'tenui', 'tenuit', 'tenuerunt', 'tentum',
  'tenebam', 'tenebo', 'teneam', 'tenerem',

  // valere
  'valere', 'valeo', 'vales', 'valet', 'valemus', 'valetis', 'valent',
  'valui', 'valuit', 'valuerunt',
  'valebam', 'valebo', 'valeam', 'valerem', 'vale', 'valete',

  // timere
  'timere', 'timeo', 'times', 'timet', 'timemus', 'timetis', 'timent',
  'timui', 'timuit', 'timuerunt',
  'timebam', 'timebo', 'timeam', 'timerem',

  // tacere
  'tacere', 'taceo', 'taces', 'tacet', 'tacemus', 'tacetis', 'tacent',
  'tacui', 'tacuit', 'tacuerunt', 'tacitum', 'tacitus',
  'tacebam', 'tacebo', 'taceam', 'tacerem',

  // delere
  'delere', 'deleo', 'deles', 'delet', 'delemus', 'deletis', 'delent',
  'delevi', 'delevit', 'deleverunt', 'deletum', 'deletus',
  'delebam', 'delebo', 'deleam', 'delerem',

  // sedere
  'sedere', 'sedeo', 'sedes', 'sedet', 'sedemus', 'sedetis', 'sedent',
  'sedi', 'sedit', 'sederunt', 'sessum',
  'sedebam', 'sedebo', 'sedeam', 'sederem',

  // ridere
  'ridere', 'rideo', 'rides', 'ridet', 'ridemus', 'ridetis', 'rident',
  'risi', 'risit', 'riserunt', 'risum',
  'ridebam', 'ridebo', 'rideam', 'riderem',

  // manere
  'manere', 'maneo', 'manes', 'manet', 'manemus', 'manetis', 'manent',
  'mansi', 'mansit', 'manserunt', 'mansum',
  'manebam', 'manebo', 'maneam', 'manerem',

  // augere
  'augere', 'augeo', 'auges', 'auget', 'augemus', 'augetis', 'augent',
  'auxi', 'auxit', 'auxerunt', 'auctum', 'auctus',
  'augebam', 'augebo', 'augeam', 'augerem',

  // iubere
  'iubere', 'iubeo', 'iubes', 'iubet', 'iubemus', 'iubetis', 'iubent',
  'iussi', 'iussit', 'iusserunt', 'iussum', 'iussus',
  'iubebam', 'iubebo', 'iubeam', 'iuberem',

  // respondere
  'respondere', 'respondeo', 'respondes', 'respondet', 'respondemus', 'respondetis', 'respondent',
  'respondi', 'respondit', 'responderunt', 'responsum',
  'respondebam', 'respondebo', 'respondeam', 'responderem',

  // debere
  'debere', 'debeo', 'debes', 'debet', 'debemus', 'debetis', 'debent',
  'debui', 'debuit', 'debuerunt', 'debitum', 'debitus',
  'debebam', 'debebo', 'debeam', 'deberem',

  // nocere
  'nocere', 'noceo', 'noces', 'nocet', 'nocemus', 'nocetis', 'nocent',
  'nocui', 'nocuit', 'nocuerunt', 'nocitum',

  // placere
  'placere', 'placeo', 'places', 'placet', 'placemus', 'placetis', 'placent',
  'placui', 'placuit', 'placuerunt', 'placitum',
  'placebam', 'placebo', 'placeam', 'placerem',

  // miscere
  'miscere', 'misceo', 'misces', 'miscet', 'miscemus', 'miscetis', 'miscent',
  'miscui', 'miscuit', 'miscuerunt', 'mixtum', 'mixtus',

  // continere
  'continere', 'contineo', 'contines', 'continet', 'continemus', 'continetis', 'continent',
  'continui', 'continuit', 'continuerunt', 'contentum', 'contentus',
  'continebam', 'continebo', 'contineam', 'continerem',

  // pertinere
  'pertinere', 'pertineo', 'pertines', 'pertinet', 'pertinemus', 'pertinетis', 'pertinent',
  'pertinui', 'pertinuit', 'pertinuerunt',

  // sustinere
  'sustinere', 'sustineo', 'sustines', 'sustinet', 'sustinemus', 'sustinetis', 'sustinent',
  'sustinui', 'sustinuit', 'sustinuerunt', 'sustentum',

  // obtinere
  'obtinere', 'obtineo', 'obtines', 'obtinet', 'obtinemus', 'obtinetis', 'obtinent',
  'obtinui', 'obtinuit', 'obtinuerunt', 'obtentum',

  // retinere
  'retinere', 'retineo', 'retines', 'retinet', 'retinemus', 'retinetis', 'retinent',
  'retinui', 'retinuit', 'retinuerunt', 'retentum',

  // ── 3rd Conjugation (agere model) ──
  'agere', 'ago', 'agis', 'agit', 'agimus', 'agitis', 'agunt',
  'egi', 'egisti', 'egit', 'egimus', 'egistis', 'egerunt',
  'actum', 'actus', 'acta',
  'agebam', 'agebas', 'agebat', 'agebamus', 'agebatis', 'agebant',
  'agam', 'ages', 'aget', 'agemus', 'agetis', 'agent',
  'agam', 'agas', 'agat', 'agamus', 'agatis', 'agant',
  'agerem', 'ageres', 'ageret', 'ageremus', 'ageretis', 'agerent',
  'egerim', 'egeris', 'egerit', 'egerimus', 'egeritis', 'egerint',
  'egissem', 'egisse', 'agens', 'agentis', 'agendo',

  // dicere
  'dicere', 'dico', 'dicis', 'dicit', 'dicimus', 'dicitis', 'dicunt',
  'dixi', 'dixisti', 'dixit', 'diximus', 'dixistis', 'dixerunt',
  'dictum', 'dictus', 'dicta',
  'dicebam', 'dicebas', 'dicebat', 'dicebamus', 'dicebatis', 'dicebant',
  'dicam', 'dices', 'dicet', 'dicemus', 'dicetis', 'dicent',
  'dicam', 'dicas', 'dicat', 'dicamus', 'dicatis', 'dicant',
  'dicerem', 'diceres', 'diceret', 'diceremus', 'diceretis', 'dicerent',
  'dixerim', 'dixisse', 'dicens', 'dicentis', 'dicendo',

  // ducere
  'ducere', 'duco', 'ducis', 'ducit', 'ducimus', 'ducitis', 'ducunt',
  'duxi', 'duxisti', 'duxit', 'duximus', 'duxistis', 'duxerunt',
  'ductum', 'ductus', 'ducta',
  'ducebam', 'ducam', 'ducas', 'ducat', 'ducamus', 'ducatis', 'ducant',
  'ducerem', 'duceres', 'duceret',
  'duxerim', 'duxisse', 'ducens', 'ducentis', 'ducendo',

  // facere (3rd -io)
  'facere', 'facio', 'facis', 'facit', 'facimus', 'facitis', 'faciunt',
  'feci', 'fecisti', 'fecit', 'fecimus', 'fecistis', 'fecerunt',
  'factum', 'factus', 'facta',
  'faciebam', 'faciam', 'facies', 'faciet', 'faciemus', 'facietis', 'facient',
  'faciam', 'facias', 'faciat', 'faciamus', 'faciatis', 'faciant',
  'facerem', 'faceres', 'faceret',
  'fecerim', 'fecisse', 'faciens', 'facientis', 'faciendo',

  // capere (3rd -io)
  'capere', 'capio', 'capis', 'capit', 'capimus', 'capitis', 'capiunt',
  'cepi', 'cepisti', 'cepit', 'cepimus', 'cepistis', 'ceperunt',
  'captum', 'captus', 'capta',
  'capiebam', 'capiam', 'capis', 'capit',
  'capiam', 'capias', 'capiat', 'capiamus', 'capiatis', 'capiant',
  'caperem', 'caperes', 'caperet',
  'ceperim', 'cepisse', 'capiens', 'capientis', 'capiendo',

  // mittere
  'mittere', 'mitto', 'mittis', 'mittit', 'mittimus', 'mittitis', 'mittunt',
  'misi', 'misisti', 'misit', 'misimus', 'misistis', 'miserunt',
  'missum', 'missus', 'missa',
  'mittebam', 'mittam', 'mittes', 'mittet', 'mittemus', 'mittetis', 'mittent',
  'mittam', 'mittas', 'mittat', 'mittamus', 'mittatis', 'mittant',
  'mitterem', 'mitteres', 'mitteret',
  'miserim', 'misisse', 'mittens', 'mittentis', 'mittendo',

  // scribere
  'scribere', 'scribo', 'scribis', 'scribit', 'scribimus', 'scribitis', 'scribunt',
  'scripsi', 'scripsisti', 'scripsit', 'scripsimus', 'scripsistis', 'scripserunt',
  'scriptum', 'scriptus', 'scripta',
  'scribebam', 'scribam', 'scribes', 'scribet',
  'scribam', 'scribas', 'scribat', 'scribamus', 'scribatis', 'scribant',
  'scriberem', 'scriberes', 'scriberet',
  'scripserim', 'scripsisse', 'scribens', 'scribentis', 'scribendo',

  // legere
  'legere', 'lego', 'legis', 'legit', 'legimus', 'legitis', 'legunt',
  'legi', 'legisti', 'legit', 'legimus', 'legistis', 'legerunt',
  'lectum', 'lectus', 'lecta',
  'legebam', 'legam', 'leges', 'leget',
  'legam', 'legas', 'legat', 'legamus', 'legatis', 'legant',
  'legerem', 'legeres', 'legeret',
  'legerim', 'legisse', 'legens', 'legentis', 'legendo',

  // petere
  'petere', 'peto', 'petis', 'petit', 'petimus', 'petitis', 'petunt',
  'petivi', 'petivit', 'petiverunt', 'petitum', 'petitus',
  'petebam', 'petam', 'petas', 'petat',
  'peterem', 'peteres', 'peteret',

  // ponere
  'ponere', 'pono', 'ponis', 'ponit', 'ponimus', 'ponitis', 'ponunt',
  'posui', 'posuisti', 'posuit', 'posuimus', 'posuistis', 'posuerunt',
  'positum', 'positus', 'posita',
  'ponebam', 'ponam', 'pones', 'ponet',
  'ponam', 'ponas', 'ponat', 'ponamus', 'ponatis', 'ponant',
  'ponerem', 'poneres', 'poneret',
  'posuerim', 'posuisse', 'ponens', 'ponentis', 'ponendo',

  // currere
  'currere', 'curro', 'curris', 'currit', 'currimus', 'curritis', 'currunt',
  'cucurri', 'cucurrit', 'cucurrerunt', 'cursum', 'cursus',
  'currebam', 'curram', 'curras', 'currat',
  'currerem', 'curreres', 'curreret',

  // cadere
  'cadere', 'cado', 'cadis', 'cadit', 'cadimus', 'caditis', 'cadunt',
  'cecidi', 'cecidit', 'ceciderunt', 'casum',
  'cadebam', 'cadam', 'cadas', 'cadat',
  'caderem', 'caderes', 'caderet',

  // cedere
  'cedere', 'cedo', 'cedis', 'cedit', 'cedimus', 'ceditis', 'cedunt',
  'cessi', 'cessit', 'cesserunt', 'cessum',
  'cedebam', 'cedam', 'cedas', 'cedat',
  'cederem', 'cederes', 'cederet',

  // vincere
  'vincere', 'vinco', 'vincis', 'vincit', 'vincimus', 'vincitis', 'vincunt',
  'vici', 'vicisti', 'vicit', 'vicimus', 'vicistis', 'vicerunt',
  'victum', 'victus', 'victa',
  'vincebam', 'vincam', 'vincas', 'vincat',
  'vincerem', 'vinceres', 'vinceret',

  // vivere
  'vivere', 'vivo', 'vivis', 'vivit', 'vivimus', 'vivitis', 'vivunt',
  'vixi', 'vixit', 'vixerunt', 'victum',
  'vivebam', 'vivam', 'vivas', 'vivat',
  'viverem', 'viveres', 'viveret',

  // accedere
  'accedere', 'accedo', 'accedis', 'accedit', 'accedimus', 'acceditis', 'accedunt',
  'accessi', 'accessit', 'accesserunt', 'accessum',

  // discedere
  'discedere', 'discedo', 'discedis', 'discedit', 'discedimus', 'disceditis', 'discedunt',
  'discessi', 'discessit', 'discesserunt', 'discessum',

  // procedere
  'procedere', 'procedo', 'procedis', 'procedit', 'procedimus', 'proceditis', 'procedunt',
  'processi', 'processit', 'processerunt', 'processum',

  // accipere
  'accipere', 'accipio', 'accipis', 'accipit', 'accipimus', 'accipitis', 'accipiunt',
  'accepi', 'accepisti', 'accepit', 'accepimus', 'accepistis', 'acceperunt',
  'acceptum', 'acceptus',
  'accipiebam', 'accipiam', 'accipirem',

  // excipere
  'excipere', 'excipio', 'excipis', 'excipit', 'excipimus', 'excipitis', 'excipiunt',
  'excepi', 'excepit', 'exceperunt', 'exceptum',

  // incipere
  'incipere', 'incipio', 'incipis', 'incipit', 'incipimus', 'incipitis', 'incipiunt',
  'incepi', 'incepit', 'inceperunt', 'inceptum',
  'incipiebam', 'incipiam',

  // fugere
  'fugere', 'fugio', 'fugis', 'fugit', 'fugimus', 'fugitis', 'fugiunt',
  'fugi', 'fugit', 'fugerunt', 'fugitum',
  'fugiebam', 'fugiam', 'fugias', 'fugiat',
  'fugerem', 'fugeres', 'fugeret',

  // trahere
  'trahere', 'traho', 'trahis', 'trahit', 'trahimus', 'trahitis', 'trahunt',
  'traxi', 'traxisti', 'traxit', 'traximus', 'traxistis', 'traxerunt',
  'tractum', 'tractus',
  'trahebam', 'traham', 'trahas', 'trahat',
  'traherem', 'traheres', 'traheret',

  // quaerere
  'quaerere', 'quaero', 'quaeris', 'quaerit', 'quaerimus', 'quaeritis', 'quaerunt',
  'quaesivi', 'quaesivit', 'quaesiverunt', 'quaesitum',
  'quaerebam', 'quaeram', 'quaeras', 'quaerat',
  'quaererem', 'quaereres', 'quaereret',

  // relinquere
  'relinquere', 'relinquo', 'relinquis', 'relinquit', 'relinquimus', 'relinquitis', 'relinquunt',
  'reliqui', 'reliquisti', 'reliquit', 'reliquimus', 'reliquistis', 'reliquerunt',
  'relictum', 'relictus',
  'relinquebam', 'relinquam', 'relinquas', 'relinquat',
  'relinquerem', 'relinqueres', 'relinqueret',

  // sumere
  'sumere', 'sumo', 'sumis', 'sumit', 'sumimus', 'sumitis', 'sumunt',
  'sumpsi', 'sumpsit', 'sumpserunt', 'sumptum',
  'sumebam', 'sumam', 'sumas', 'sumat',
  'sumerem', 'sumeres', 'sumeret',

  // solvere
  'solvere', 'solvo', 'solvis', 'solvit', 'solvimus', 'solvitis', 'solvunt',
  'solvi', 'solvit', 'solverunt', 'solutum', 'solutus',
  'solvebam', 'solvam', 'solvas', 'solvat',

  // volvere
  'volvere', 'volvo', 'volvis', 'volvit', 'volvimus', 'volvitis', 'volvunt',
  'volvi', 'volvit', 'volverunt', 'volutum',

  // vertere
  'vertere', 'verto', 'vertis', 'vertit', 'vertimus', 'vertitis', 'vertunt',
  'verti', 'vertit', 'verterunt', 'versum', 'versus',
  'vertebam', 'vertam', 'vertas', 'vertat',

  // gerere
  'gerere', 'gero', 'geris', 'gerit', 'gerimus', 'geritis', 'gerunt',
  'gessi', 'gessit', 'gesserunt', 'gestum', 'gestus',
  'gerebam', 'geram', 'geras', 'gerat',
  'gererem', 'gereres', 'gereret',

  // defendere
  'defendere', 'defendo', 'defendis', 'defendit', 'defendimus', 'defenditis', 'defendunt',
  'defendi', 'defendit', 'defenderunt', 'defensum', 'defensus',
  'defendebam', 'defendam', 'defendas', 'defendat',

  // ostendere
  'ostendere', 'ostendo', 'ostendis', 'ostendit', 'ostendimus', 'ostenditis', 'ostendunt',
  'ostendi', 'ostendit', 'ostenderunt', 'ostentum', 'ostensus',

  // reddere
  'reddere', 'reddo', 'reddis', 'reddit', 'reddimus', 'redditis', 'reddunt',
  'reddidi', 'reddidit', 'reddiderunt', 'redditum', 'redditus',
  'reddebam', 'reddam', 'reddas', 'reddat',

  // credere
  'credere', 'credo', 'credis', 'credit', 'credimus', 'creditis', 'credunt',
  'credidi', 'credidit', 'crediderunt', 'creditum', 'creditus',
  'credebam', 'credam', 'credas', 'credat',
  'crederem', 'crederes', 'crederet',

  // includere
  'includere', 'includo', 'includis', 'includit', 'includimus', 'includitis', 'includunt',
  'inclusi', 'inclusit', 'incluserunt', 'inclusum', 'inclusus',

  // claudere
  'claudere', 'claudo', 'claudis', 'claudit', 'claudimus', 'clauditis', 'claudunt',
  'clausi', 'clausit', 'clauserunt', 'clausum', 'clausus',

  // ── 4th Conjugation (audire model) ──
  'audire', 'audio', 'audis', 'audit', 'audimus', 'auditis', 'audiunt',
  'audivi', 'audivisti', 'audivit', 'audivimus', 'audivistis', 'audiverunt',
  'auditum', 'auditus', 'audita',
  'audiebam', 'audiebas', 'audiebat', 'audiebamus', 'audiebatis', 'audiebant',
  'audiam', 'audies', 'audiet', 'audiemus', 'audietis', 'audient',
  'audiam', 'audias', 'audiat', 'audiamus', 'audiatis', 'audiant',
  'audirem', 'audires', 'audiret', 'audiremus', 'audiretis', 'audirent',
  'audiverim', 'audivisse', 'audiens', 'audientis', 'audiendo',

  // sentire
  'sentire', 'sentio', 'sentis', 'sentit', 'sentimus', 'sentitis', 'sentiunt',
  'sensi', 'sensisti', 'sensit', 'sensimus', 'sensistis', 'senserunt',
  'sensum', 'sensus', 'sensa',
  'sentiebam', 'sentiam', 'sentias', 'sentiat',
  'sentirem', 'sentires', 'sentiret',
  'senserim', 'sensisse', 'sentiens', 'sentientis', 'sentiendo',

  // venire
  'venire', 'venio', 'venis', 'venit', 'venimus', 'venitis', 'veniunt',
  'veni', 'venisti', 'venit', 'venimus', 'venistis', 'venerunt',
  'ventum',
  'veniebam', 'veniam', 'venias', 'veniat',
  'venirem', 'venires', 'veniret',
  'venerim', 'venisse', 'veniens', 'venientis', 'veniendo',

  // invenire
  'invenire', 'invenio', 'invenis', 'invenit', 'invenimus', 'invenitis', 'inveniunt',
  'inveni', 'invenisti', 'invenit', 'invenimus', 'invenistis', 'invenerunt',
  'inventum', 'inventus',
  'inveniebam', 'inveniam',

  // munire
  'munire', 'munio', 'munis', 'munit', 'munimus', 'munitis', 'muniunt',
  'munivi', 'munivit', 'muniverunt', 'munitum', 'munitus',
  'muniebam', 'muniam',

  // finire
  'finire', 'finio', 'finis', 'finit', 'finimus', 'finitis', 'finiunt',
  'finivi', 'finivit', 'finiverunt', 'finitum', 'finitus',

  // punire
  'punire', 'punio', 'punis', 'punit', 'punimus', 'punitis', 'puniunt',
  'punivi', 'punivit', 'puniverunt', 'punitum', 'punitus',

  // ire
  'ire', 'eo', 'is', 'it', 'imus', 'itis', 'eunt',
  'ivi', 'ivit', 'iverunt', 'itum',
  'ibam', 'ibas', 'ibat', 'ibamus', 'ibatis', 'ibant',
  'ibo', 'ibis', 'ibit', 'ibimus', 'ibitis', 'ibunt',
  'eam', 'eas', 'eat', 'eamus', 'eatis', 'eant',
  'irem', 'ires', 'iret', 'iremus', 'iretis', 'irent',
  'iens', 'euntis', 'eundo',

  // ferre
  'ferre', 'fero', 'fers', 'fert', 'ferimus', 'fertis', 'ferunt',
  'tuli', 'tulisti', 'tulit', 'tulimus', 'tulistis', 'tulerunt',
  'latum', 'latus', 'lata',
  'ferebam', 'feram', 'feras', 'ferat', 'feramus', 'feratis', 'ferant',
  'ferrem', 'ferres', 'ferret',
  'tulerim', 'tulisse', 'ferens', 'ferentis', 'ferendo',

  // esse (sum)
  'esse', 'sum', 'es', 'est', 'sumus', 'estis', 'sunt',
  'fui', 'fuisti', 'fuit', 'fuimus', 'fuistis', 'fuerunt',
  'eram', 'eras', 'erat', 'eramus', 'eratis', 'erant',
  'ero', 'eris', 'erit', 'erimus', 'eritis', 'erunt',
  'sim', 'sis', 'sit', 'simus', 'sitis', 'sint',
  'essem', 'esses', 'esset', 'essemus', 'essetis', 'essent',
  'fuerim', 'fuisse', 'fore', 'futurum',

  // posse
  'posse', 'possum', 'potes', 'potest', 'possumus', 'potestis', 'possunt',
  'potui', 'potuisti', 'potuit', 'potuimus', 'potuistis', 'potuerunt',
  'poteram', 'poteras', 'poterat', 'poteramus', 'poteratis', 'poterant',
  'potero', 'poteris', 'poterit', 'poterimus', 'poteritis', 'poterunt',
  'possim', 'possis', 'possit', 'possimus', 'possitis', 'possint',
  'possem', 'posses', 'posset', 'possemus', 'possetis', 'possent',
  'potuisse', 'potens', 'potentis',

  // velle
  'velle', 'volo', 'vis', 'vult', 'volumus', 'vultis', 'volunt',
  'volui', 'voluisti', 'voluit', 'voluimus', 'voluistis', 'voluerunt',
  'volebam', 'volam', 'voles', 'volet',
  'velim', 'velis', 'velit', 'velimus', 'velitis', 'velint',
  'vellem', 'velles', 'vellet', 'vellemus', 'velletis', 'vellent',
  'voluisse',

  // nolle
  'nolle', 'nolo', 'non vis', 'non vult', 'nolumus', 'non vultis', 'nolunt',
  'nolui', 'noluisti', 'noluit', 'noluimus', 'noluistis', 'noluerunt',
  'nolebam', 'nolam', 'noles', 'nolet',
  'nolim', 'nolis', 'nolit', 'nolimus', 'nolitis', 'nolint',
  'nollem', 'nolles', 'nollet',
  'noluisse',

  // malle
  'malle', 'malo', 'mavis', 'mavult', 'malumus', 'mavultis', 'malunt',
  'malui', 'maluisti', 'maluit',
  'malebam', 'malam', 'males', 'malet',
  'malim', 'malis', 'malit',
  'mallem', 'malles', 'mallet',
  'maluisse',

  // tollo / tollere
  'tollere', 'tollo', 'tollis', 'tollit', 'tollimus', 'tollitis', 'tollunt',
  'sustuli', 'sustulit', 'sustulerunt', 'sublatum', 'sublatus',
  'tollebam', 'tollam', 'tollas', 'tollat',
  'tollerem', 'tolleres', 'tolleret',

  // fieri (passive of facere)
  'fieri', 'fio', 'fis', 'fit', 'fimus', 'fitis', 'fiunt',
  'factus sum', 'facta sum', 'factum est',
  'fiebam', 'fiam', 'fias', 'fiat', 'fiamus', 'fiatis', 'fiant',
  'fierem', 'fieres', 'fieret',

  // ire compounds
  'abire', 'abeo', 'abis', 'abit', 'abimus', 'abitis', 'abeunt',
  'abivi', 'abivit',
  'adire', 'adeo', 'adis', 'adit', 'adimus', 'aditis', 'adeunt',
  'adivi', 'adivit',
  'exire', 'exeo', 'exis', 'exit', 'eximus', 'exitis', 'exeunt',
  'exivi', 'exivit',
  'inire', 'ineo', 'inis', 'init', 'inimus', 'initis', 'ineunt',
  'inivi', 'inivit',
  'redire', 'redeo', 'redis', 'redit', 'redimus', 'reditis', 'redeunt',
  'redivi', 'redivit',
  'transire', 'transeo', 'transis', 'transit', 'transimus', 'transitis', 'transeunt',

  // misc. common verbs
  'valere', 'valeo',
  'noscere', 'nosco', 'nosce',
  'cognosce', 'cognoscere', 'cognosco', 'cognosco', 'cognovi', 'cognitum',
  'ignorare', 'ignoro', 'ignoravi', 'ignoratum',
  'properare', 'propero', 'properavi',
  'pati', 'patior', 'pateris', 'patitur', 'patimur', 'patimini', 'patiuntur',
  'passus', 'passum',
  'loqui', 'loquor', 'loqueris', 'loquitur', 'loquimur', 'loquimini', 'loquuntur',
  'locutus', 'locutum',
  'sequi', 'sequor', 'sequeris', 'sequitur', 'sequimur', 'sequimini', 'sequuntur',
  'secutus', 'secutum',
  'proficisci', 'proficiscor', 'proficisceris', 'proficiscitur',
  'profectus', 'profectum',
  'uti', 'utor', 'uteris', 'utitur', 'utimur', 'utimini', 'utuntur',
  'usus', 'usum',
  'frui', 'fruor', 'frueris', 'fruitur', 'fruimur', 'fruimini', 'fruuntur',
  'fruitus', 'fruitum',
  'fungi', 'fungor', 'fungeris', 'fungitur', 'fungimur', 'fungimini', 'funguntur',
  'functus', 'functum',
  'nasci', 'nascor', 'nasceris', 'nascitur', 'nascimur', 'nascimini', 'nascuntur',
  'natus', 'natum',
  'mori', 'morior', 'moreris', 'moritur', 'morimur', 'morimini', 'moriuntur',
  'mortuus', 'mortuum',
  'conari', 'conor', 'conaris', 'conatur', 'conamur', 'conamini', 'conantur',
  'conatus', 'conatum',
  'hortari', 'hortor', 'hortaris', 'hortatur', 'hortamur', 'hortamini', 'hortantur',
  'hortatus', 'hortatum',
  'vereri', 'vereor', 'vereris', 'veretur', 'veremur', 'veremini', 'verentur',
  'veritus', 'veritum',
  'mirari', 'miror', 'miraris', 'miratur', 'miramur', 'miramini', 'mirantur',
  'miratus', 'miratum',
  'arbitrari', 'arbitror', 'arbitraris', 'arbitratur',
  'arbitratus', 'arbitratum',
  'polliceri', 'polliceor', 'polliceris', 'pollicetur',
  'pollicitus', 'pollicitum',

  // ══════════════════════════════════════════════════════════
  // NOUNS – 1st Declension (a-stems, mostly feminine)
  // ══════════════════════════════════════════════════════════

  // aqua
  'aqua', 'aquae', 'aquam', 'aquas',

  // terra
  'terra', 'terrae', 'terram', 'terras', 'terrarum',

  // via
  'via', 'viae', 'viam', 'vias', 'viarum',

  // puella
  'puella', 'puellae', 'puellam', 'puellas', 'puellarum',

  // nauta (m.)
  'nauta', 'nautae', 'nautam', 'nautas', 'nautarum',

  // poeta (m.)
  'poeta', 'poetae', 'poetam', 'poetas', 'poetarum',

  // agricola (m.)
  'agricola', 'agricolae', 'agricolam', 'agricolas', 'agricolarum',

  // insula
  'insula', 'insulae', 'insulam', 'insulas', 'insularum',

  // victoria
  'victoria', 'victoriae', 'victoriam', 'victorias', 'victoriarum',

  // familia
  'familia', 'familiae', 'familiam', 'familias', 'familiarum',

  // fortuna
  'fortuna', 'fortunae', 'fortunam', 'fortunas', 'fortunarum',

  // gloria
  'gloria', 'gloriae', 'gloriam', 'glorias', 'gloriarum',

  // causa
  'causa', 'causae', 'causam', 'causas', 'causarum',

  // silva
  'silva', 'silvae', 'silvam', 'silvas', 'silvarum',

  // luna
  'luna', 'lunae', 'lunam', 'lunas', 'lunarum',

  // stella
  'stella', 'stellae', 'stellam', 'stellas', 'stellarum',

  // regina
  'regina', 'reginae', 'reginam', 'reginas', 'reginarum',

  // Roma
  'roma', 'romae', 'romam',

  // filia
  'filia', 'filiae', 'filiam', 'filias', 'filiarum',

  // patria
  'patria', 'patriae', 'patriam', 'patrias', 'patriarum',

  // copia
  'copia', 'copiae', 'copiam', 'copias', 'copiarum',

  // memoria
  'memoria', 'memoriae', 'memoriam', 'memorias', 'memoriarum',

  // natura
  'natura', 'naturae', 'naturam', 'naturas', 'naturarum',

  // cura
  'cura', 'curae', 'curam', 'curas', 'curarum',

  // hora
  'hora', 'horae', 'horam', 'horas', 'horarum',

  // littera
  'littera', 'litterae', 'litteram', 'litteras', 'litterarum',

  // lingua
  'lingua', 'linguae', 'linguam', 'linguas', 'linguarum',

  // penna
  'penna', 'pennae', 'pennam', 'pennas', 'pennarum',

  // porta
  'porta', 'portae', 'portam', 'portas', 'portarum',

  // turba
  'turba', 'turbae', 'turbam', 'turbas', 'turbarum',

  // sapientia
  'sapientia', 'sapientiae', 'sapientiam', 'sapientias',

  // scientia
  'scientia', 'scientiae', 'scientiam', 'scientias',

  // amicitia
  'amicitia', 'amicitiae', 'amicitiam', 'amicitias',

  // victoria
  // (already above)

  // ══════════════════════════════════════════════════════════
  // NOUNS – 2nd Declension (o-stems, mostly masculine/neuter)
  // ══════════════════════════════════════════════════════════

  // amicus
  'amicus', 'amici', 'amico', 'amicum', 'amice', 'amicis', 'amicos', 'amicorum',

  // dominus
  'dominus', 'domini', 'domino', 'dominum', 'domine', 'dominis', 'dominos', 'dominorum',

  // filius
  'filius', 'filii', 'filio', 'filium', 'filii', 'filiis', 'filios', 'filiorum',

  // servus
  'servus', 'servi', 'servo', 'servum', 'serve', 'servis', 'servos', 'servorum',

  // puer
  'puer', 'pueri', 'puero', 'puerum', 'pueri', 'pueris', 'pueros', 'puerorum',

  // vir
  'vir', 'viri', 'viro', 'virum', 'vir', 'viris', 'viros', 'virorum',

  // ager
  'ager', 'agri', 'agro', 'agrum', 'agri', 'agris', 'agros', 'agrorum',

  // magister
  'magister', 'magistri', 'magistro', 'magistrum', 'magistri', 'magistris', 'magistros', 'magistrorum',

  // liber
  'liber', 'libri', 'libro', 'librum', 'libri', 'libris', 'libros', 'librorum',

  // populus
  'populus', 'populi', 'populo', 'populum', 'popule', 'populis', 'populos', 'populorum',

  // animus
  'animus', 'animi', 'animo', 'animum', 'animi', 'animis', 'animos', 'animorum',

  // locus
  'locus', 'loci', 'loco', 'locum', 'loci', 'locis', 'locos', 'locorum',
  'loca', 'locorum',

  // modus
  'modus', 'modi', 'modo', 'modum', 'modi', 'modis', 'modos', 'modorum',

  // numerus
  'numerus', 'numeri', 'numero', 'numerum', 'numeri', 'numeris', 'numeros', 'numerorum',

  // equus
  'equus', 'equi', 'equo', 'equum', 'equi', 'equis', 'equos', 'equorum',

  // deus
  'deus', 'dei', 'deo', 'deum', 'dei', 'diis', 'deos', 'deorum',
  'di', 'dis',

  // Romanus
  'romanus', 'romani', 'romano', 'romanum', 'romani', 'romanis', 'romanos', 'romanorum',
  'romana', 'romanae', 'romanam',

  // gladius
  'gladius', 'gladii', 'gladio', 'gladium', 'gladii', 'gladiis', 'gladios', 'gladiorum',

  // nuntius
  'nuntius', 'nuntii', 'nuntio', 'nuntium', 'nuntii', 'nuntiis', 'nuntios', 'nuntiorum',

  // socius
  'socius', 'socii', 'socio', 'socium', 'socii', 'sociis', 'socios', 'sociorum',

  // annus
  'annus', 'anni', 'anno', 'annum', 'anni', 'annis', 'annos', 'annorum',

  // campus
  'campus', 'campi', 'campo', 'campum', 'campi', 'campis', 'campos', 'camporum',

  // hortus
  'hortus', 'horti', 'horto', 'hortum', 'horti', 'hortis', 'hortos', 'hortorum',

  // ludus
  'ludus', 'ludi', 'ludo', 'ludum', 'ludi', 'ludis', 'ludos', 'ludorum',

  // mundus
  'mundus', 'mundi', 'mundo', 'mundum', 'mundi', 'mundis', 'mundos', 'mundorum',

  // cibus
  'cibus', 'cibi', 'cibo', 'cibum', 'cibi', 'cibis', 'cibos', 'ciborum',

  // ventus
  'ventus', 'venti', 'vento', 'ventum', 'venti', 'ventis', 'ventos', 'ventorum',

  // legatus
  'legatus', 'legati', 'legato', 'legatum', 'legati', 'legatis', 'legatos', 'legatorum',

  // senatus
  'senatus', 'senatus', 'senatui', 'senatum', 'senatu',

  // exercitus
  'exercitus', 'exercitus', 'exercitui', 'exercitum', 'exercitu',
  'exercitibus',

  // magistratus
  'magistratus', 'magistratus', 'magistratui', 'magistratum', 'magistratu',

  // fructus
  'fructus', 'fructus', 'fructui', 'fructum', 'fructu', 'fructibus',

  // portus
  'portus', 'portus', 'portui', 'portum', 'portu', 'portibus',

  // 2nd decl. neuter
  'bellum', 'belli', 'bello', 'bella', 'bellorum', 'bellis',

  'verbum', 'verbi', 'verbo', 'verba', 'verborum', 'verbis',

  'templum', 'templi', 'templo', 'templa', 'templorum', 'templis',

  'signum', 'signi', 'signo', 'signa', 'signorum', 'signis',

  'periculum', 'periculi', 'periculo', 'pericula', 'periculorum', 'periculis',

  'oppidum', 'oppidi', 'oppido', 'oppida', 'oppidorum', 'oppidis',

  'scutum', 'scuti', 'scuto', 'scuta', 'scutorum', 'scutis',

  'saxum', 'saxi', 'saxo', 'saxa', 'saxorum', 'saxis',

  'auxilium', 'auxilii', 'auxilio', 'auxilia', 'auxiliorum', 'auxiliis',

  'consilium', 'consili', 'consilio', 'consilia', 'consiliorum', 'consiliis',
  'consilii',

  'studium', 'studii', 'studio', 'studia', 'studiorum', 'studiis',

  'imperium', 'imperii', 'imperio', 'imperia', 'imperiorum', 'imperiis',

  'praemium', 'praemii', 'praemio', 'praemia', 'praemiorum', 'praemiis',

  'proelium', 'proelii', 'proelio', 'proelia', 'proeliorum', 'proeliis',

  'regnum', 'regni', 'regno', 'regna', 'regnorum', 'regnis',

  'pilum', 'pili', 'pilo', 'pila', 'pilorum', 'pilis',

  'castrum', 'castri', 'castro', 'castra', 'castrorum', 'castris',

  'forum', 'fori', 'foro', 'fora', 'fororum', 'foris',

  'gaudium', 'gaudii', 'gaudio', 'gaudia', 'gaudiorum', 'gaudiis',

  'otium', 'otii', 'otio', 'otia', 'otiorum', 'otiis',

  'pretium', 'pretii', 'pretio', 'pretia', 'pretiorum', 'pretiis',

  'tergum', 'tergi', 'tergo', 'terga', 'tergorum', 'tergis',

  'somnium', 'somnii', 'somnio', 'somnia', 'somniorum', 'somniis',

  'officium', 'officii', 'officio', 'officia', 'officiorum', 'officiis',

  // ══════════════════════════════════════════════════════════
  // NOUNS – 3rd Declension (consonant & i-stems)
  // ══════════════════════════════════════════════════════════

  // rex
  'rex', 'regis', 'regi', 'regem', 'rege', 'reges', 'regum', 'regibus',

  // dux
  'dux', 'ducis', 'duci', 'ducem', 'duce', 'duces', 'ducum', 'ducibus',

  // miles
  'miles', 'militis', 'militi', 'militem', 'milite', 'milites', 'militum', 'militibus',

  // homo
  'homo', 'hominis', 'homini', 'hominem', 'homine', 'homines', 'hominum', 'hominibus',

  // civis
  'civis', 'civis', 'civi', 'civem', 'cive', 'cives', 'civium', 'civibus',

  // lex
  'lex', 'legis', 'legi', 'legem', 'lege', 'leges', 'legum', 'legibus',

  // pax
  'pax', 'pacis', 'paci', 'pacem', 'pace', 'paces', 'pacum', 'pacibus',

  // vox
  'vox', 'vocis', 'voci', 'vocem', 'voce', 'voces', 'vocum', 'vocibus',

  // nox
  'nox', 'noctis', 'nocti', 'noctem', 'nocte', 'noctes', 'noctium', 'noctibus',

  // lux
  'lux', 'lucis', 'luci', 'lucem', 'luce', 'luces', 'lucum', 'lucibus',

  // pons
  'pons', 'pontis', 'ponti', 'pontem', 'ponte', 'pontes', 'pontium', 'pontibus',

  // mons
  'mons', 'montis', 'monti', 'montem', 'monte', 'montes', 'montium', 'montibus',

  // fons
  'fons', 'fontis', 'fonti', 'fontem', 'fonte', 'fontes', 'fontium', 'fontibus',

  // pars
  'pars', 'partis', 'parti', 'partem', 'parte', 'partes', 'partium', 'partibus',

  // mors
  'mors', 'mortis', 'morti', 'mortem', 'morte', 'mortes', 'mortium', 'mortibus',

  // arx
  'arx', 'arcis', 'arci', 'arcem', 'arce', 'arces', 'arcium', 'arcibus',

  // urbs
  'urbs', 'urbis', 'urbi', 'urbem', 'urbe', 'urbes', 'urbium', 'urbibus',

  // navis
  'navis', 'navis', 'navi', 'navem', 'nave', 'naves', 'navium', 'navibus',

  // hostis
  'hostis', 'hostis', 'hosti', 'hostem', 'hoste', 'hostes', 'hostium', 'hostibus',

  // finis
  'finis', 'finis', 'fini', 'finem', 'fine', 'fines', 'finium', 'finibus',

  // ignis
  'ignis', 'ignis', 'igni', 'ignem', 'igne', 'ignes', 'ignium', 'ignibus',

  // collis
  'collis', 'collis', 'colli', 'collem', 'colle', 'colles', 'collium', 'collibus',

  // flumen
  'flumen', 'fluminis', 'flumini', 'flumen', 'flumine', 'flumina', 'fluminum', 'fluminibus',

  // nomen
  'nomen', 'nominis', 'nomini', 'nomen', 'nomine', 'nomina', 'nominum', 'nominibus',

  // tempus
  'tempus', 'temporis', 'tempori', 'tempus', 'tempore', 'tempora', 'temporum', 'temporibus',

  // corpus
  'corpus', 'corporis', 'corpori', 'corpus', 'corpore', 'corpora', 'corporum', 'corporibus',

  // opus
  'opus', 'operis', 'operi', 'opus', 'opere', 'opera', 'operum', 'operibus',

  // genus
  'genus', 'generis', 'generi', 'genus', 'genere', 'genera', 'generum', 'generibus',

  // iter
  'iter', 'itineris', 'itineri', 'iter', 'itinere', 'itinera', 'itinerum', 'itineribus',

  // caput
  'caput', 'capitis', 'capiti', 'caput', 'capite', 'capita', 'capitum', 'capitibus',

  // latus
  // (careful: also adjective)
  'latus', 'lateris', 'lateri', 'latus', 'latere', 'latera', 'laterum', 'lateribus',

  // pes
  'pes', 'pedis', 'pedi', 'pedem', 'pede', 'pedes', 'pedum', 'pedibus',

  // frater
  'frater', 'fratris', 'fratri', 'fratrem', 'fratre', 'fratres', 'fratrum', 'fratribus',

  // mater
  'mater', 'matris', 'matri', 'matrem', 'matre', 'matres', 'matrum', 'matribus',

  // pater
  'pater', 'patris', 'patri', 'patrem', 'patre', 'patres', 'patrum', 'patribus',

  // soror
  'soror', 'sororis', 'sorori', 'sororem', 'sorore', 'sorores', 'sororum', 'sororibus',

  // amor
  'amor', 'amoris', 'amori', 'amorem', 'amore', 'amores', 'amorum', 'amoribus',

  // timor
  'timor', 'timoris', 'timori', 'timorem', 'timore', 'timores', 'timorum', 'timoribus',

  // labor
  'labor', 'laboris', 'labori', 'laborem', 'labore', 'labores', 'laborum', 'laboribus',

  // dolor
  'dolor', 'doloris', 'dolori', 'dolorem', 'dolore', 'dolores', 'dolorum', 'doloribus',

  // honor
  'honor', 'honoris', 'honori', 'honorem', 'honore', 'honores', 'honorum', 'honoribus',

  // error
  'error', 'erroris', 'errori', 'errorem', 'errore', 'errores', 'errorum', 'erroribus',

  // terror
  'terror', 'terroris', 'terrori', 'terrorem', 'terrore', 'terrores', 'terrorum', 'terroribus',

  // consul
  'consul', 'consulis', 'consuli', 'consulem', 'consule', 'consules', 'consulum', 'consulibus',

  // mos
  'mos', 'moris', 'mori', 'morem', 'more', 'mores', 'morum', 'moribus',

  // custos
  'custos', 'custodis', 'custodi', 'custodem', 'custode', 'custodes', 'custodium', 'custodibus',

  // comes
  'comes', 'comitis', 'comiti', 'comitem', 'comite', 'comites', 'comitum', 'comitibus',

  // dives
  'dives', 'divitis', 'diviti', 'divitem', 'divite', 'divites', 'divitum', 'divitibus',

  // senex
  'senex', 'senis', 'seni', 'senem', 'sene', 'senes', 'senum', 'senibus',

  // iuvenis
  'iuvenis', 'iuvenis', 'iuveni', 'iuvenem', 'iuvene', 'iuvenes', 'iuvenum', 'iuvenibus',

  // virtus
  'virtus', 'virtutis', 'virtuti', 'virtutem', 'virtute', 'virtutes', 'virtutum', 'virtutibus',

  // civitas
  'civitas', 'civitatis', 'civitati', 'civitatem', 'civitate', 'civitates', 'civitatum', 'civitatibus',

  // veritas
  'veritas', 'veritatis', 'veritati', 'veritatem', 'veritate', 'veritates', 'veritatum', 'veritatibus',

  // libertas
  'libertas', 'libertatis', 'libertati', 'libertatem', 'libertate', 'libertates', 'libertatum', 'libertatibus',

  // voluntas
  'voluntas', 'voluntatis', 'voluntati', 'voluntatem', 'voluntate', 'voluntates', 'voluntatum', 'voluntatibus',

  // potestas
  'potestas', 'potestatis', 'potestati', 'potestatem', 'potestate', 'potestates', 'potestatum', 'potestatibus',

  // aetas
  'aetas', 'aetatis', 'aetati', 'aetatem', 'aetate', 'aetates', 'aetatium', 'aetatibus',

  // plebs
  'plebs', 'plebis', 'plebi', 'plebem', 'plebe',

  // hostis
  // (already above)

  // vis
  'vis', 'vires', 'virium', 'viribus',

  // dies
  'dies', 'diei', 'die', 'diem', 'dies',
  'dierum', 'diebus',

  // res
  'res', 'rei', 'rei', 'rem', 're', 'rerum', 'rebus',

  // spes
  'spes', 'spei', 'spei', 'spem', 'spe', 'spebus',

  // fides
  'fides', 'fidei', 'fidei', 'fidem', 'fide',

  // domus
  'domus', 'domus', 'domui', 'domum', 'domo', 'domi', 'domos', 'domorum', 'domibus',

  // manus
  'manus', 'manus', 'manui', 'manum', 'manu', 'manus', 'manuum', 'manibus',

  // genu
  'genu', 'genus', 'genu', 'genua', 'genuum', 'genibus',

  // ══════════════════════════════════════════════════════════
  // ADJECTIVES – 1st / 2nd Declension
  // ══════════════════════════════════════════════════════════

  // magnus
  'magnus', 'magna', 'magnum',
  'magni', 'magnae', 'magno', 'magnam', 'magnos', 'magnas', 'magnis', 'magnorum',
  'maior', 'maius', 'maiores', 'maiora', 'maiorum', 'maioribus',
  'maximus', 'maxima', 'maximum', 'maximi', 'maximos',

  // parvus
  'parvus', 'parva', 'parvum',
  'parvi', 'parvae', 'parvo', 'parvam', 'parvos', 'parvas', 'parvis', 'parvorum',
  'minor', 'minus', 'minores', 'minora', 'minorum', 'minoribus',
  'minimus', 'minima', 'minimum',

  // bonus
  'bonus', 'bona', 'bonum',
  'boni', 'bonae', 'bono', 'bonam', 'bonos', 'bonas', 'bonis', 'bonorum',
  'melior', 'melius', 'meliores', 'meliora', 'meliorum', 'melioribus',
  'optimus', 'optima', 'optimum', 'optimi', 'optimos',

  // malus
  'malus', 'mala', 'malum',
  'mali', 'malae', 'malo', 'malam', 'malos', 'malas', 'malis', 'malorum',
  'peior', 'peius', 'peiores', 'peiora',
  'pessimus', 'pessima', 'pessimum',

  // multus
  'multus', 'multa', 'multum',
  'multi', 'multae', 'multo', 'multam', 'multos', 'multas', 'multis', 'multorum',
  'plus', 'pluris', 'plures', 'plura', 'plurium', 'pluribus',
  'plurimus', 'plurima', 'plurimum',

  // longus
  'longus', 'longa', 'longum',
  'longi', 'longae', 'longo', 'longam', 'longos', 'longas', 'longis', 'longorum',
  'longior', 'longius', 'longiores',
  'longissimus', 'longissima', 'longissimum',

  // latus (wide)
  // 'latus', 'lata', 'latum', (careful: also noun)

  // altus
  'altus', 'alta', 'altum',
  'alti', 'altae', 'alto', 'altam', 'altos', 'altas', 'altis', 'altorum',
  'altior', 'altius', 'altiores',
  'altissimus', 'altissima', 'altissimum',

  // novus
  'novus', 'nova', 'novum',
  'novi', 'novae', 'novo', 'novam', 'novos', 'novas', 'novis', 'novorum',
  'novior', 'novissimus',

  // antiquus
  'antiquus', 'antiqua', 'antiquum',
  'antiqui', 'antiquae', 'antiquo', 'antiquam',

  // pulcher
  'pulcher', 'pulchra', 'pulchrum',
  'pulchri', 'pulchrae', 'pulchro', 'pulchram',
  'pulchrior', 'pulcherrimuss', 'pulcherrimus',

  // niger
  'niger', 'nigra', 'nigrum',
  'nigri', 'nigrae', 'nigro', 'nigram',

  // liber (free)
  'liber', 'libera', 'liberum',
  'liberi', 'liberae', 'libero', 'liberam',

  // aeger
  'aeger', 'aegra', 'aegrum',
  'aegri', 'aegrae', 'aegro', 'aegram',

  // asper
  'asper', 'aspera', 'asperum',
  'asperi', 'asperae', 'aspero', 'asperam',

  // laetus
  'laetus', 'laeta', 'laetum',
  'laeti', 'laetae', 'laeto', 'laetam',

  // miser
  'miser', 'misera', 'miserum',
  'miseri', 'miserae', 'misero', 'miseram',

  // durus
  'durus', 'dura', 'durum',
  'duri', 'durae', 'duro', 'duram',

  // tutus
  'tutus', 'tuta', 'tutum',
  'tuti', 'tutae', 'tuto', 'tutam',

  // latus (wide)
  'lata', 'latum',

  // clarus
  'clarus', 'clara', 'clarum',
  'clari', 'clarae', 'claro', 'claram',

  // varius
  'varius', 'varia', 'varium',
  'varii', 'variae', 'vario', 'variam',

  // carus
  'carus', 'cara', 'carum',
  'cari', 'carae', 'caro', 'caram',

  // gratus
  'gratus', 'grata', 'gratum',
  'grati', 'gratae', 'grato', 'gratam',

  // dignus
  'dignus', 'digna', 'dignum',
  'digni', 'dignae', 'digno', 'dignam',

  // plenus
  'plenus', 'plena', 'plenum',
  'pleni', 'plenae', 'pleno', 'plenam',

  // sacer
  'sacer', 'sacra', 'sacrum',
  'sacri', 'sacrae', 'sacro', 'sacram',

  // sanctus
  'sanctus', 'sancta', 'sanctum',
  'sancti', 'sanctae', 'sancto', 'sanctam',

  // dexter
  'dexter', 'dextra', 'dextrum',
  'dextri', 'dextrae', 'dextro', 'dextram',

  // sinister
  'sinister', 'sinistra', 'sinistrum',
  'sinistri', 'sinistrae', 'sinistro', 'sinistram',

  // iustus
  'iustus', 'iusta', 'iustum',
  'iusti', 'iustae', 'iusto', 'iustam',

  // fortis (3rd declension adj.)
  'fortis', 'forte',
  'fortes', 'fortia', 'fortium', 'fortibus', 'fortem',
  'fortior', 'fortius', 'fortiores',
  'fortissimus', 'fortissima', 'fortissimum',

  // gravis
  'gravis', 'grave',
  'graves', 'gravia', 'gravium', 'gravibus', 'gravem',
  'gravior', 'gravius', 'graviores',
  'gravissimus', 'gravissima', 'gravissimum',

  // brevis
  'brevis', 'breve',
  'breves', 'brevia', 'brevium', 'brevibus', 'brevem',
  'brevior', 'brevius', 'breviores',
  'brevissimus', 'brevissima', 'brevissimum',

  // levis
  'levis', 'leve',
  'leves', 'levia', 'levium', 'levibus', 'levem',
  'levior', 'levius',
  'levissimus',

  // tristis
  'tristis', 'triste',
  'tristes', 'tristia', 'tristium', 'tristibus', 'tristem',
  'tristior', 'tristius',
  'tristissimus',

  // facilis
  'facilis', 'facile',
  'faciles', 'facilia', 'facilium', 'facilibus', 'facilem',
  'facilior', 'facilius',
  'facillimus',

  // difficilis
  'difficilis', 'difficile',
  'difficiles', 'difficilia', 'difficilium', 'difficilibus', 'difficilem',
  'difficilior', 'difficilius',
  'difficillimus',

  // similis
  'similis', 'simile',
  'similes', 'similia', 'similium', 'similibus', 'similem',

  // dissimilis
  'dissimilis', 'dissimile',

  // omnis
  'omnis', 'omne',
  'omnes', 'omnia', 'omnium', 'omnibus', 'omnem',

  // communis
  'communis', 'commune',
  'communes', 'communia', 'communium', 'communibus', 'communem',

  // utilis
  'utilis', 'utile',
  'utiles', 'utilia', 'utilium', 'utilibus', 'utilem',

  // nobilis
  'nobilis', 'nobile',
  'nobiles', 'nobilia', 'nobilium', 'nobilibus', 'nobilem',

  // humilis
  'humilis', 'humile',
  'humiles', 'humilia', 'humilium', 'humilibus', 'humilem',

  // subtilis
  'subtilis', 'subtile',

  // crudelis
  'crudelis', 'crudele',
  'crudeles', 'crudelia', 'crudelium', 'crudelibus', 'crudelior',

  // fidelis
  'fidelis', 'fidele',
  'fideles', 'fidelia', 'fidelium', 'fidelibus',

  // iners (gen. inertis)
  'iners', 'inertis', 'inerti', 'inertem', 'inerte',

  // acer (gen. acris)
  'acer', 'acris', 'acre',
  'acres', 'acria', 'acrium', 'acribus', 'acrem',
  'acrior', 'acrius',
  'acerrimus', 'acerrima', 'acerrimum',

  // celer
  'celer', 'celeris', 'celere',
  'celeres', 'celeria', 'celerium', 'celeribus', 'celerem',
  'celerior', 'celerius',
  'celerrimus', 'celerrima', 'celerrimum',

  // vetus
  'vetus', 'veteris', 'veteri', 'veter', 'vetere', 'veteres',
  'veterum', 'veteribus',
  'vetustus', 'vetusta', 'vetustum',

  // ══════════════════════════════════════════════════════════
  // ADDITIONAL COMMON VOCABULARY
  // ══════════════════════════════════════════════════════════

  // Body parts
  'oculus', 'oculi', 'oculo', 'oculum', 'oculos', 'oculis', 'oculorum',
  'auris', 'auris', 'auri', 'aurem', 'aure', 'aures', 'aurium', 'auribus',
  'nasus', 'nasi', 'naso', 'nasum',
  'os', 'oris', 'ori', 'ora', 'oris',
  'lingua', 'linguae',
  'manus', 'manus',
  'pes', 'pedis',
  'caput', 'capitis',
  'corpus', 'corporis',
  'cor', 'cordis', 'cordi', 'cor', 'corde', 'corda', 'cordium', 'cordibus',
  'anima', 'animae', 'animam', 'animas',
  'sanguis', 'sanguinis', 'sanguini', 'sanguinem', 'sanguine',
  'vultus', 'vultus', 'vultui', 'vultum', 'vultu',
  'cervix', 'cervicis', 'cervici', 'cervicem', 'cervice',

  // Family
  'pater', 'patris',
  'mater', 'matris',
  'frater', 'fratris',
  'soror', 'sororis',
  'filius', 'filii',
  'filia', 'filiae',
  'vir', 'viri',
  'uxor', 'uxoris', 'uxori', 'uxorem', 'uxore', 'uxores', 'uxorum', 'uxoribus',
  'maritus', 'mariti', 'marito', 'maritum',
  'liberi', 'liberorum', 'liberis',
  'parens', 'parentis', 'parenti', 'parentem', 'parente', 'parentes', 'parentium', 'parentibus',
  'avus', 'avi', 'avo', 'avum',
  'avia', 'aviae', 'aviam',
  'nepos', 'nepotis', 'nepoti', 'nepotem', 'nepote',

  // Time
  'dies', 'diei',
  'nox', 'noctis',
  'hora', 'horae',
  'annus', 'anni',
  'mensis', 'mensis', 'mensi', 'mensem', 'mense', 'menses', 'mensium', 'mensibus',
  'saeculum', 'saeculi', 'saeculo', 'saecula',
  'tempus', 'temporis',
  'aetas', 'aetatis',
  'mane', 'vesperi', 'noctu', 'heri', 'hodie', 'cras', 'olim', 'nunc',
  'diu', 'brevi', 'subito', 'statim', 'mox',

  // Nature
  'terra', 'terrae',
  'caelum', 'caeli', 'caelo', 'caela',
  'sol', 'solis', 'soli', 'solem', 'sole',
  'luna', 'lunae',
  'stella', 'stellae',
  'aqua', 'aquae',
  'flumen', 'fluminis',
  'mare', 'maris', 'mari', 'mare', 'maria', 'marium', 'maribus',
  'silva', 'silvae',
  'arbor', 'arboris', 'arbori', 'arborem', 'arbore', 'arbores', 'arborum', 'arboribus',
  'herba', 'herbae', 'herbam', 'herbas',
  'flos', 'floris', 'flori', 'florem', 'flore', 'flores', 'florum', 'floribus',
  'mons', 'montis',
  'campus', 'campi',
  'saxum', 'saxi',
  'petra', 'petrae', 'petram',
  'ventus', 'venti',
  'imber', 'imbris', 'imbri', 'imbrem', 'imbre', 'imbres', 'imbrium', 'imbribus',
  'nix', 'nivis', 'nivi', 'nivem', 'nive', 'nives', 'nivium', 'nivibus',
  'ignis', 'ignis',

  // City / War / State
  'urbs', 'urbis',
  'oppidum', 'oppidi',
  'murus', 'muri', 'muro', 'murum', 'muri', 'muris', 'muros', 'murorum',
  'porta', 'portae',
  'via', 'viae',
  'forum', 'fori',
  'templum', 'templi',
  'castrum', 'castri',
  'arx', 'arcis',
  'miles', 'militis',
  'dux', 'ducis',
  'rex', 'regis',
  'consul', 'consulis',
  'senator', 'senatoris', 'senatori', 'senatorem', 'senatore',
  'exercitus', 'exercitus',
  'legio', 'legionis', 'legioni', 'legionem', 'legione', 'legiones', 'legionum', 'legionibus',
  'centurio', 'centurionis', 'centurioni', 'centurionem', 'centurione',
  'praedium', 'praedii', 'praedio', 'praedia',
  'imperator', 'imperatoris', 'imperatori', 'imperatorem', 'imperatore',
  'populus', 'populi',
  'civis', 'civis',
  'hostis', 'hostis',
  'bellum', 'belli',
  'pax', 'pacis',
  'proelium', 'proelii',
  'victoria', 'victoriae',
  'arma', 'armorum', 'armis',
  'telum', 'teli', 'telo', 'telum', 'tela', 'telorum', 'telis',
  'scutum', 'scuti',
  'gladius', 'gladii',
  'hasta', 'hastae', 'hastam', 'hastas',
  'arcus', 'arcus', 'arcui', 'arcum', 'arcu', 'arcuum', 'arcibus',
  'sagitta', 'sagittae', 'sagittam', 'sagittas',

  // Common abstract nouns
  'amor', 'amoris',
  'timor', 'timoris',
  'dolor', 'doloris',
  'honor', 'honoris',
  'labor', 'laboris',
  'virtus', 'virtutis',
  'libertas', 'libertatis',
  'veritas', 'veritatis',
  'periculum', 'periculi',
  'gaudium', 'gaudii',
  'spes', 'spei',
  'fides', 'fidei',
  'lex', 'legis',
  'mos', 'moris',
  'vis', 'vires',
  'ratio', 'rationis', 'rationi', 'rationem', 'ratione', 'rationes', 'rationum', 'rationibus',
  'oratio', 'orationis', 'orationi', 'orationem', 'oratione', 'orationes', 'orationum', 'orationibus',
  'natio', 'nationis', 'nationi', 'nationem', 'natione', 'nationes', 'nationum', 'nationibus',
  'occasio', 'occasionis', 'occasioni', 'occasionem', 'occasione',
  'condicio', 'condicionis', 'condicioni', 'condicionem', 'condicione',

  // People / social
  'amicus', 'amici',
  'inimicus', 'inimici', 'inimico', 'inimicum', 'inimicos', 'inimicorum',
  'dominus', 'domini',
  'servus', 'servi',
  'magister', 'magistri',
  'discipulus', 'discipuli', 'discipulo', 'discipulum', 'discipulos', 'discipulorum',
  'discipula', 'discipulae', 'discipulam',
  'agricola', 'agricolae',
  'nauta', 'nautae',
  'poeta', 'poetae',
  'orator', 'oratoris', 'oratori', 'oratorem', 'oratore',
  'scriptor', 'scriptoris', 'scriptori', 'scriptorem', 'scriptore',
  'victor', 'victoris', 'victori', 'victorem', 'victore',
  'auctor', 'aictoris', 'auctori', 'auctorem', 'auctore',
  'auctorem', 'auctoris',
  'mercator', 'mercatoris', 'mercatori', 'mercatorem', 'mercatore',

  // Objects / everyday
  'casa', 'casae', 'casam', 'casas',
  'villa', 'villae', 'villam', 'villas',
  'mensa', 'mensae', 'mensam', 'mensas',
  'sella', 'sellae', 'sellam', 'sellas',
  'lectus', 'lecti', 'lecto', 'lectum',
  'cena', 'cenae', 'cenam', 'cenas',
  'panis', 'panis', 'pani', 'panem', 'pane',
  'vinum', 'vini', 'vino', 'vina',
  'pecunia', 'pecuniae', 'pecuniam', 'pecunias',
  'aurum', 'auri', 'auro',
  'argentum', 'argenti', 'argento',
  'donum', 'doni', 'dono', 'donum', 'dona', 'donorum', 'donis',
  'munus', 'muneris', 'muneri', 'munus', 'munere', 'munera', 'munerum', 'muneribus',
  'copia', 'copiae',
  'eques', 'equitis', 'equiti', 'equitem', 'equite', 'equites', 'equitum', 'equitibus',
  'equitatus', 'equitatus',
  'navis', 'navis',
  'currus', 'currus', 'currui', 'currum', 'curru',

  // Verbs compounds / misc
  'adferre', 'adfero', 'adfers', 'adfert', 'adtuli', 'adlatum',
  'afferre', 'affero', 'affers', 'affert', 'attuli', 'allatum',
  'conferre', 'confero', 'confers', 'confert', 'contuli', 'collatum',
  'differre', 'differo', 'differs', 'differt', 'distuli', 'dilatum',
  'inferre', 'infero', 'infers', 'infert', 'intuli', 'illatum',
  'offerre', 'offero', 'offers', 'offert', 'obtuli', 'oblatum',
  'referre', 'refero', 'refers', 'refert', 'rettuli', 'relatum',
  'transferre', 'transfero', 'transfers', 'transfert', 'transtuli', 'translatum',

  // esse compounds
  'adesse', 'adsum', 'ades', 'adest', 'adfui',
  'abesse', 'absum', 'abes', 'abest', 'abfui',
  'inesse', 'insum', 'ines', 'inest', 'infui',
  'interesse', 'intersum', 'interes', 'interest', 'interfui',
  'praeesse', 'praesum', 'praees', 'praeest', 'praefui',
  'prodesse', 'prosum', 'prodes', 'prodest', 'profui',

  // Other frequent verb forms
  'noli', 'nolite', 'fac', 'fer', 'dic', 'duc', 'i',
  'ama', 'amate', 'lauda', 'laudate', 'vide', 'videte',
  'audi', 'audite', 'veni', 'venite', 'abi', 'abite',
  'cave', 'cavete',

  // Participles commonly used as adjectives
  'amans', 'amantis', 'amantibus',
  'timens', 'timentis', 'timentibus',
  'sapiens', 'sapientis', 'sapiente', 'sapientes', 'sapientium', 'sapientibus',
  'praesens', 'praesentis', 'praesente', 'praesentes', 'praesentium', 'praesentibus',
  'absens', 'absentis', 'absente', 'absentes', 'absentium', 'absentibus',
  'potens', 'potentis', 'potente', 'potentes', 'potentium', 'potentibus',
  'patiens', 'patientis', 'patiente', 'patientes', 'patientium', 'patientibus',
  'constans', 'constantis', 'constante', 'constantes', 'constantium', 'constantibus',
  'clemens', 'clementis', 'clemente', 'clementes', 'clementium', 'clementibus',
  'ingens', 'ingentis', 'ingenti', 'ingentem', 'ingente', 'ingentes', 'ingentium', 'ingentibus',
  'recens', 'recentis', 'recenti', 'recentem', 'recente', 'recentes', 'recentium', 'recentibus',

  // Common phrases split into words
  'pro', 'patria', 'gloria',
  'per', 'aspera',
  'ad', 'astra',
  'carpe', 'diem',
  'veni', 'vidi',

  // Miscellaneous important words
  'quia', 'quoniam', 'quod', 'dum', 'donec',
  'postquam', 'antequam', 'priusquam',
  'quamvis', 'quamquam', 'etsi', 'tametsi',
  'modo', 'dummodo',
  'ideo', 'idcirco', 'propterea',
  'quare', 'qua', 'quam', 'quantum', 'quanti', 'quid',
  'cur', 'num', 'ne', 'nonne', 'utrum',
  'nihil', 'nil', 'nemo', 'nullus',
  'aliquid', 'aliquod', 'quidquam', 'quicquam',
  'nescio', 'nescis', 'nescit',
  'scio', 'scis', 'scit', 'scimus', 'scitis', 'sciunt',
  'scivi', 'scivit', 'sciverunt', 'scitum',
  'sciebam', 'sciam',

  // ── Additional common forms (from OCR testing) ──
  'oblectare', 'oblecto', 'oblectavi', 'oblectatum',
  'exspectare', 'exspecto', 'exspectavi', 'exspectatum',
  'expectare', 'expecto', 'expectavi', 'expectatum',
  'consisto', 'consistere', 'constiti',
  'constituo', 'constituere', 'constitui', 'constitutum',
  'haud', 'haut',
  'pono', 'ponere', 'posui', 'positum',
  'iudicare', 'iudico', 'iudicavi', 'iudicatum', 'iudicium',
  'delectare', 'delecto', 'delectavi', 'delectatum',
  'consulere', 'consulo', 'consului', 'consultum', 'consultare',
  'consilium', 'consili', 'consilio',
  'sentire', 'sentio', 'sensi', 'sensum',
  'tollere', 'tollo', 'sustuli', 'sublatum',
  'rapere', 'rapio', 'rapui', 'raptum',
  'accidere', 'accido', 'accidi',
  'procedere', 'procedo', 'processi', 'processum',
  'tradere', 'trado', 'tradidi', 'traditum',
  'praebere', 'praebeo', 'praebui', 'praebitum',
  'desistere', 'desisto', 'destiti',
  'resistere', 'resisto', 'restiti',
  'existimare', 'existimo', 'existimavi', 'existimatum',
  'navigare', 'navigo', 'navigavi', 'navigatum',
  'imperare', 'impero', 'imperavi', 'imperatum',
  'liberare', 'libero', 'liberavi', 'liberatum',
  'occupare', 'occupo', 'occupavi', 'occupatum',
  'superare', 'supero', 'superavi', 'superatum',
  'appellare', 'appello', 'appellavi', 'appellatum',
  'nuntiare', 'nuntio', 'nuntiavi', 'nuntiatum',
  'cogitare', 'cogito', 'cogitavi', 'cogitatum',
  'spectare', 'specto', 'spectavi', 'spectatum',
  'demonstrare', 'demonstro', 'demonstravi', 'demonstratum',
  'regnare', 'regno', 'regnavi', 'regnatum',
  'narrare', 'narro', 'narravi', 'narratum',
  'orare', 'oro', 'oravi', 'oratum',
  'temptare', 'tempto', 'temptavi', 'temptatum',
  'tentare', 'tento', 'tentavi', 'tentatum',
  'errare', 'erro', 'erravi', 'erratum',
  'exclamare', 'exclamo', 'exclamavi', 'exclamatum',
  'incitare', 'incito', 'incitavi', 'incitatum',
  'invitare', 'invito', 'invitavi', 'invitatum',
  'laudare', 'laudo', 'laudavi', 'laudatum',
  'mandare', 'mando', 'mandavi', 'mandatum',
  'negare', 'nego', 'negavi', 'negatum',
  'optare', 'opto', 'optavi', 'optatum',
  'parare', 'paro', 'paravi', 'paratum',
  'portare', 'porto', 'portavi', 'portatum',
  'servare', 'servo', 'servavi', 'servatum',
  'vastare', 'vasto', 'vastavi', 'vastatum',
  'vulnerare', 'vulnero', 'vulneravi', 'vulneratum',
  'dolere', 'doleo', 'dolui', 'dolitum',
  'gaudere', 'gaudeo', 'gavisus',
  'merere', 'mereo', 'merui', 'meritum',
  'studere', 'studeo', 'studui',
  'suadere', 'suadeo', 'suasi', 'suasum',
  'terrere', 'terreo', 'terrui', 'territum',
  'valere', 'valeo', 'valui', 'valitum',
  'colere', 'colo', 'colui', 'cultum',
  'contendere', 'contendo', 'contendi', 'contentum',
  'credere', 'credo', 'credidi', 'creditum',
  'currere', 'curro', 'cucurri', 'cursum',
  'defendere', 'defendo', 'defendi', 'defensum',
  'gerere', 'gero', 'gessi', 'gestum',
  'ludere', 'ludo', 'lusi', 'lusum',
  'pellere', 'pello', 'pepuli', 'pulsum',
  'quaerere', 'quaero', 'quaesivi', 'quaesitum',
  'solvere', 'solvo', 'solvi', 'solutum',
  'surgere', 'surgo', 'surrexi', 'surrectum',
  'tangere', 'tango', 'tetigi', 'tactum',
  'vertere', 'verto', 'verti', 'versum',
  'vivere', 'vivo', 'vixi', 'victum',
  'accipere', 'accipio', 'accepi', 'acceptum',
  'conspicere', 'conspicio', 'conspexi', 'conspectum',
  'efficere', 'efficio', 'effeci', 'effectum',
  'incipere', 'incipio', 'incepi', 'inceptum',
  'perficere', 'perficio', 'perfeci', 'perfectum',
  'interficere', 'interficio', 'interfeci', 'interfectum',
  'aperire', 'aperio', 'aperui', 'apertum',
  'munire', 'munio', 'munivi', 'munitum',
  'invenire', 'invenio', 'inveni', 'inventum',
  'pervenire', 'pervenio', 'perveni', 'perventum',
  'convenire', 'convenio', 'conveni', 'conventum',

  // ── Common nouns/adjectives from textbooks ──
  'itineris', 'itinere', 'iter',
  'imperator', 'imperatoris', 'imperatore', 'imperatorem',
  'senator', 'senatoris', 'senatorem', 'senatore',
  'orator', 'oratoris', 'oratorem', 'oratore',
  'gladiator', 'gladiatoris',
  'periculum', 'periculi', 'periculo',
  'auxilium', 'auxili', 'auxilio',
  'beneficium', 'benefici', 'beneficio',
  'imperium', 'imperii', 'imperio',
  'studium', 'studi', 'studio',
  'negotium', 'negoti', 'negotio',
  'officium', 'offici', 'officio',
  'praemium', 'praemi', 'praemio',
  'proelium', 'proeli', 'proelio',
  'spatium', 'spati', 'spatio',
  'pretium', 'preti', 'pretio',

]);

// ──────────────────────────────────────────────────────────
// Levenshtein distance
// ──────────────────────────────────────────────────────────
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  // Use a rolling two-row approach to save memory
  let prev = new Uint16Array(n + 1);
  let curr = new Uint16Array(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1];
      } else {
        curr[j] = 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
      }
    }
    // swap
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

// ──────────────────────────────────────────────────────────
// OCR correction using dictionary matching
// ──────────────────────────────────────────────────────────

/**
 * Correct OCR errors using dictionary matching.
 *
 * For each card the front text is split by commas to get individual
 * forms. Within each form every whitespace-delimited token that is
 * 3+ characters long is checked against LATIN_DICT. If the token is
 * not already in the dictionary and a candidate with Levenshtein
 * distance ≤ 2 exists, the token is replaced by the best (closest)
 * match.
 *
 * All punctuation, spacing and overall structure is preserved.
 *
 * @param  {Array<{front: string, back: string, [key: string]: any}>} cards
 * @returns {Array}  corrected cards (new array, originals not mutated)
 */
function correctWithDictionary(cards) {
  // Build a sorted array once for iteration (Set has no fast min-search)
  const dictWords = Array.from(LATIN_DICT);

  /**
   * Find the best dictionary match for a single token.
   * Returns { word, distance } or null if nothing is within maxDist.
   */
  function bestMatch(token, maxDist) {
    const lower = token.toLowerCase();
    let best = null;
    let bestDist = maxDist + 1;

    for (const word of dictWords) {
      // Quick length filter: if length difference alone exceeds maxDist, skip
      if (Math.abs(word.length - lower.length) > maxDist) continue;

      const d = levenshtein(lower, word);
      if (d < bestDist) {
        bestDist = d;
        best = word;
        if (d === 1) break; // Can't do better than 1 without being exact
      }
    }
    return bestDist <= maxDist ? { word: best, distance: bestDist } : null;
  }

  /**
   * Correct all recognisable words inside a single form string
   * (= text between commas on the card front).
   * Preserves leading/trailing whitespace and punctuation attached to tokens.
   */
  function correctForm(form) {
    // Split into tokens, keeping delimiters (spaces) so we can rejoin
    // We use a regex that splits on word boundaries while keeping
    // punctuation attached to words (e.g. trailing dot in "m.")
    return form.replace(/\S+/g, (token) => {
      // Strip leading/trailing punctuation for matching, but keep it
      const match = token.match(/^([^a-zA-ZäöüÄÖÜ]*)([a-zA-ZäöüÄÖÜ].*?)([^a-zA-ZäöüÄÖÜ]*)$/);
      if (!match) return token; // purely punctuation, keep as-is

      const [, prefix, word, suffix] = match;

      // Skip very short words
      if (word.length < 3) return token;

      const lowerWord = word.toLowerCase();

      // Already in dictionary → keep as-is
      if (LATIN_DICT.has(lowerWord)) return token;

      // Scale max distance by word length: short words get less tolerance
      const maxDist = word.length <= 4 ? 1 : 2;
      const result = bestMatch(lowerWord, maxDist);
      if (!result || result.distance === 0) return token;

      // Preserve original capitalisation pattern
      let corrected = result.word;
      if (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
        corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
      }

      return prefix + corrected + suffix;
    });
  }

  return cards.map((card) => {
    if (!card.front || typeof card.front !== 'string') return { ...card };

    // Split front by commas, correct each form, rejoin
    const forms = card.front.split(',');
    const correctedForms = forms.map(correctForm);
    const correctedFront = correctedForms.join(',');

    if (correctedFront === card.front) return { ...card };
    return { ...card, front: correctedFront };
  });
}

// ──────────────────────────────────────────────────────────
// Exports (Node.js / browser-compatible)
// ──────────────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LATIN_DICT, levenshtein, correctWithDictionary };
}
