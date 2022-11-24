import { splitIds } from './utilities';

export const buildDiagnosis = ({ id, name: nameAndCode }) => {
  const [name, code] = nameAndCode.split(/\t/);
  return { id, name, code, type: 'icd10' };
};

export const ICD10_DIAGNOSES = splitIds(`
  Acute axillary lymphadenitis	L04.2
  Acute bacterial infection	A49.9
  Acute bacterial otitis externa	H60.5
  Acute bacterial paronychia	L03.0
  Acute bacterial pharyngitis	J02.9
  Acute bacterial pneumonia	J15.9
  Acute bacterial prostatitis	N41.0
  Acute bacterial pyelonephritis	N10
  Acute blood loss anemia	D62
  Acute bronchiolitis	J21.9
  Acute bronchitis	J20.9
  Acute calculous cholecystisits	K80.0
  Acute catarrh	J00
  Acute catarrhal inflammation	J00
  Acute cerebral infarction	I63.9
  Acute cervical adenitis	L04.0
  Acute cervical lymphadenitis	L04.0
  Acute cholangitis	K83.0
  Acute cholecystitis	K81.0
  Acute colitis	A09.9
  Acute conjunctivitis	H10.3
  Acute cystitis	N30.0
  Acute diarrhea	A09.9
  Acute diffuse otitis externa	H60.3
  Acute diverticulitis	K57.9
  Acute drunkenness (in alcoholism)	F10.0
  Acute endocarditis	I33.9
  Acute enteritis	A09.9
  Acute epididymitis	N45.9
  Acute exudative tonsillitis	J03.9
  Acute febrile illiness	R50.9
  Acute gangrenous cholecystitis	K81.0
  Acute gastric ulcer bleeding	K25.0
  Acute gastritis	K29.7
  Acute gastroenteritis	A09.9
  Acute gingivitis	K05.0
  Acute gout attack	M10.9
  Acute gouty arthritis	M10.9
  Acute headache	R52.0
  Acute hemorrhagic anemia	D62
  Acute hepatitis	K72.0
  Acute hepatitis drug induced	K71.2
  Acute infective otitis externa	H60.8
  Acute infective rhinitis	J00
  Acute inferior myocardial infarction	I21.1
  Acute inferior ST elevated myocardial infarction	I21.1
  Acute inguinal adenitis	L04.3
  Acute inguinal lymphadenitis	L04.3
  Acute ischemic heart disease	I24.9
  Acute ischemic stroke	I63.9
  Acute kidney injury	N17.9
  Acute labyrinthitis	H83.0
  Acute lacunar infarction	I63.9
  Acute lower respiratory infection	J22
  Acute lymphadenitis	L04.9
  Acute lymphadenitis at abdominal wall	L04.1
  Acute lymphadenitis at ankle	L04.3
  Acute lymphadenitis at arm	L04.2
  Acute lymphadenitis at axilla	L04.2
  Acute lymphadenitis at back	L04.1
  Acute lymphadenitis at breast	L04.1
  Acute lymphadenitis at buttock	L04.1
  Acute lymphadenitis at chest wall	L04.1
  Acute lymphadenitis at ear	L04.0
  Acute lymphadenitis at elbow	L04.2
  Acute lymphadenitis at eyelid	L04.0
  Acute lymphadenitis at face	L04.0
  Acute lymphadenitis at finger	L04.2
  Acute lymphadenitis at foot	L04.3
  Acute lymphadenitis at forearm	L04.2
  Acute lymphadenitis at groin	L04.3
  Acute lymphadenitis at hand	L04.2
  Acute lymphadenitis at hip	L04.3
  Acute lymphadenitis at knee	L04.3
  Acute lymphadenitis at leg	L04.3
  Acute lymphadenitis at neck	L04.0
  Acute lymphadenitis at nose	L04.0
  Acute lymphadenitis at scalp	L04.0
  Acute lymphadenitis at shoulder	L04.2
  Acute lymphadenitis at thigh	L04.3
  Acute lymphadenitis at toe	L04.3
  Acute lymphadenitis at wrist	L04.2
  Acute lymphoblastic leukaemia	C91.0
  Acute lymphoblastic leukaemia high risk	C91.0
  Acute lymphoblastic leukaemia low risk	C91.0
  Acute lymphoblastic leukaemia remission	C91.0
  Acute mastitis	N61
  Acute middle cerebral artery infarction	I63.5
  Acute monoparesis	G83.3
  Acute myeloblastic leukemia without maturation	C92.0
  Acute myeloid leukaemia	C92.0
  Acute myocarditis	I40.9
  Acute myocardial infarction	I21.9
  Acute nasopharyngitis	J00
  Acute non ST elevated myocardial infarction	I21.9
  Acute ontop chronic hepatitis B infection	B16.9
  Acute ontop chronic pelvic inflammatory disease	N73.0
  Acute ontop chronic renal failure	N17.9
  Acute otitis externa	H60.5
  Acute otitis media	H66.9
  Acute otitis media or myringitis	H66.9
  Acute pain	R52.0
  Acute pancreatitis	K85.9
  Acute paronychia	L03.0
  Acute pelvic inflammatory disease	N73.0
  Acute pericarditis	I30.9
  Acute periodontitis	K05.2
  Acute pharyngitis	J02.9
  Acute pharyngotonsillitis	J03.9
  Acute PID	N73.0
  Acute pneumonia	J18.9
  Acute pneumonitis	J18.9
  Acute poliomyelitis	A80.9
  Acute posthaemorrhagic Anemia	D62
  Acute post-hemorrhagic anemia	D62
  Acute poststreptococcal glomerulonephritis	N00.0
  Acute pyelonephritis	N10
  Acute rash	R21
  Acute renal failure	N17.9
  Acute renal infection	N10
  Acute retention of urine	R33
  Acute rheumatic heart disease	I01.9
  Acute rhinopharyngitis	J00
  Acute rhinosinusitis	J01.9
  Acute rupture appendicitis	K35.3
  Acute scrotal pain	N50.8
  Acute severe asthma	J46
  Acute sinusitis	J01.9
  Acute sphenoid sinusitis	J01.9
  Acute stress disorder	F43.0
  Acute stress reaction	F43.0
  Acute subdural hematoma	S06.5
  Acute suppurative appendicitis	K35.8
  Acute suppurative parotitis	K11.2
  Acute suppurative thyroiditis	E06.0
  Acute thyroiditis	E06.0
  Acute tonsillitis	J03.9
  Acute toxic cholangitis	K83.0
  Acute tracheobronchitis	J20.9
  Acute transient early wheezing	R06.2
  Acute transmural myocardial infarction	I21.3
  Acute tubular necrosis	N17.0
  Acute urticaria	L50.9
  Acute vaginitis	N76.0
  Acute viral gastritis	K29.1
  Acute viral gastroenteritis	A09.9
  Acute viral hepatitis	B17.9
  Acute vulvitis	N76.2
  Adaptation reaction	F43.2
  Adaption reaction	F43.2
  Addiction	F19.2
  Adenoiditis	J03.9
  Adenomatous goiter	E04.9
  Adenomatous goitre	E04.9
  Adenomyosis of gallbladder	K82.8
  Adenotonsillar hypertrophy	J35.1
  Adhesion	K66.0
  Adhesion band	K66.0
  Adhesive capsulitis of shoulder	M75.0
  Adjustment and management of implanted device	Z45.9
  Adjustment disorders	F43.2
  Adjustment reaction	F43.2
  Adjustment to retirement [pension]	Z60.0
  Adnexitis	N70.9
  Adrenal gland disorder	E27.9
  Adrenal crisis	E27.2
  Adrenal insufficiency	E27.4
  Adrenogenital syndrome	E25.9
  Adult onset diabetes	E11.9
  Adult-onset diabetes mellitus	E11.9
  Adult respiratory distress syndrome	J80
  Advance glaucoma	H40.9
  Advance primary open angle glaucoma	H40.2
  Advice on contraception	Z30.0
  Aeroembolism	T70.3
  Aerophagia	F45.3
  Aerosinusitis	T70.1
  Aerotitis	T70.0
  Agitation	R45.1
  Agoraphobia	F40.0
  Agranulocytosis	D70
  AIDS	B24
  Air embolism	T79.0
  Air pollution, expose to	Z58.1
  Air sickness	T75.3
  Albinism	E70.3
  Alcohol dependence	F10.2
  Alcohol hangover	F10.0
  Alcohol intoxication	F10.0
  Alcohol intoxication, withdrawal state	F10.3
  Alcohol use	Z72.1
  Alcohol withdrawal	F10.3
  Alcohol withdrawal state	F10.3
  Alcohol withdrawal syndrome	F10.3
  Alcoholic cirrhosis	K70.3
  Alcoholic hepatitis	K71.2
  Alcoholic intoxication	F10.0
  Alcoholic liver disease	K70.9
  Alcoholic withdrawal seizure	F10.3
  Alcoholism	F10.2
  Aldosteronism	E26.9
  Alienation	F69
  Alkalemia	E87.3
  Alkalosis	E87.3
  Alkaptonuria	E70.2
  Allergic anaphylactic shock	T78.2
  Allergic contact dermatitis	L23.9
  Allergic reaction	T78.4
  Allergic rhinitis	J30.4
  Allergic urticaria	L50.9
  Allergy	T78.4
  Allergy reaction	T78.4
  Allergy to animal	J30.3
  Alopecia	L65.9
  Alopecia areata	L63.9
  Alpha thalassaemia	D56.0
  Alpha thalassemia syndrome	D56.0
  Altered bowel habits	R19.4
  Alveolar bone cleft	K08.8
  Alymphocytosis	D72.8
  Alymphoplasia	D82.1
  Alzheimer╚├═s disease	G30.9
  Amaurosis fugax	G45.3
  Ambiguous genitalia	Q56.4
  Amblyopia	H53.0
  Amebiasis	A06.9
  Amebic liver abscess	A06.3
  Ameboma	A06.3
  Amenorrhea	N91.2
  Amnesia	R41.3
  Amnionitis	na
  Amphibian bite	T63.8
  Amputation finger	S68.1
  Amputation toe	S98.1
  Amputation traumatic, ankle of foot	S98.0
  Amputation traumatic, arm, lower	S58.9
  Amputation traumatic, arm, upper	S48.9
  Amputation traumatic, finger, one (except thumb)	S68.1
  Amputation traumatic, finger, two or mores (except thumb)	S68.2
  Amputation traumatic, foot	S98.4
  Amputation traumatic, forearm	S58.9
  Amputation traumatic, hand	S68.4
  Amputation traumatic, leg, lower	S88.9
  Amputation traumatic, thigh	S78.9
  Amputation traumatic, thumb	S68.0
  Amputation traumatic, toe, one	S98.1
  Amputation traumatic, toe, two or mores	S98.2
  Amputation traumatic, wrist	S68.9
  Amyloidosis	E85.9
  Amyoplasia	Q79.8
  Amyotonia	M62.8
  Amyotrophia	G71.8
  Amyotrophic lateral sclesosis	G12.2
  AN - anorexia nervosa	F50.0
  Anacidity	K31.8
  Anal abscess	K61.0
  Anal cellulitis	K61.0
  Anal condyloma acuminata	A63.0
  Anal Fissure	K60.2
  Anal fistula	K60.3
  Anal polyp	K62.0
  Anal ulcer	K62.6
  Anal warts	A63.0
  Anaphylactic reaction	T78.2
  Anaphylactic shock	T78.2
  Anaphylaxis	T78.2
  Anarthria	R47.1
  Anasarca	R60.1
  Ancylostoma infestation	B76.0
  Androgenic alopecia	L64.9
  Anemia	D64.9
  Anemia complicating pregnancy, childbirth and the puerperium	na
  Anemia due to acute blood loss	D62
  Anemia due to blood loss	D62
  Anemia due to chronic blood loss	D50.0
  Anemia of the puerperium	na
  Anemia puerperal	na
  Anemia screening	Z13.0
  Anencephalus	Q00.0
  Aneurysm	I72.9
  Angiitis	I77.6
  Angina pectoris	I20.9
  Angiodysplasia of colon	K55.2
  Angioedema	T78.3
  Angioedema with urticaria	T78.3
  Angiomatosis	Q82.8
  Angiostrongyliasis infestation	B81.3
  Anhidrosis	L74.4
  Animal allergy	J30.3
  Animal scabies	B86
  Aniridia	Q13.1
  Anisocoria	H57.0
  Anisometropia	H52.3
  Ankle crushed	S97.0
  Ankle dislocation	S93.0
  Ankle injury	S99.9
  Ankle sprain	S93.4
  Ankyloblepharon	H02.5
  Ankylosing spondylitis	M45
  Ankyloglossia	Q38.1
  Ankylosis	M24.6
  Ankylostoma infestation	B76.0
  Ankylostomiasis	B76.0
  Annual examination	Z00.0
  Anodontia	K00.0
  Anogenital Herpes simplex infection	A60.9
  Anogenital warts	A63.0
  Anophthalmos	Q11.1
  Anopsia	H53.4
  Anorchia	Q55.0
  Anorectal abscess	K61.2
  Anorectal malformation	Q43.8
  Anorexia	R63.0
  Anorexia nervosa	F50.0
  Anosmia	R43.0
  Anoxemia	R09.0
  Anoxia	R09.0
  Antacids abuse	F55
  Antenatal screening	Z36.9
  Antepartum haemorrhage	na
  Anterior abdomen contusion	S30.1
  Anterior chest contusion	S20.3
  Anterior chest wall pain	R07.3
  Anterior cruciate ligament injury	S83.5
  Anterior cruciate ligament insufficiency	S83.5
  Anterior cruciate ligament tear	S83.5
  Anterior lens subluxation	H27.1
  Anthrax	A22.9
  Anthropophobia	F40.1
  Antisocial personality	F60.2
  Antral gastritis	K29.7
  Antritis	J32.0
  Anuria	R34
  Anus abscess	K61.0
  Anus cellulitis	K61.0
  Anus fistula	K60.3
  Anus hemorrhage	K62.5
  Anusitis	K62.8
  Anxiety	F41.9
  Anxiety generalized	F41.1
  Anxiety reaction	F41.1
  Anxiety state	F41.1
  Anxious state	F41.1
  Aortic aneurysm	I71.9
  Aortic dissection	I71.0
  Aortic regurgitation	I06.1
  Aortic valve disorder	I35.9
  Aortic stenosis	I06.2
  Aortitis	I77.6
  Apathy	R45.3
  Apepsia	K31.8
  Aphagia	R63.0
  Aphakia	H27.0
  Aphasia	R47.0
  Aphonia	R49.1
  Aphthous stomatitis	K12.0
  Aphthous ulcer	K12.0
  Aplastic anemia	D61.9
  Apnea	R06.8
  Apocrine sweat disorder	L75.9
  Appendicial abscess	K35.3
  Appendicial phlegmon	K35.3
  Appendicitis	K35.8
  Appendicitis recurrent	K36
  Appetite lack or loss	R63.0
  Appetite loss	R63.0
  Apraxia	R48.2
  Arachnidism	T63.3
  Arachnitis	G03.9
  Arachnodactyly	Q87.4
  Arachnoiditis	G03.9
  Arachnophobia	F40.2
  Arboviral fever	A94
  Areola abscess	N61
  Areola puerperal abscess	na
  Arm absence	Z89.2
  Arm broken	T10
  Arm deformity	M21.9
  Arm pain	M79.6
  Arm paralysis	G83.2
  Arrhythmia	I49.9
  Arterial occlusion	I74.9
  Arterial stenosis	I77.1
  Arteriolitis	I77.6
  Arteriosclerosis	I70.9
  Arteriovenous fistula graft stenosis	T82.5
  Arteritis	I77.6
  Artery hypertension screening	Z13.6
  Arthralgia	M25.5
  Arthritic	M13.9
  Arthritis	M13.9
  Arthropathy	M13.9
  Arthrosis	M19.9
  Arthrosis of first carpometacarpal joint	M18.9
  ASB - asymptomatic bacteriuria	N39.0
  Asbestosis	J61
  Ascariasis	B77.9
  Ascaris infestation	B77.9
  Ascending cholangitis	K83.0
  Ascites	R18
  Aseptic meningitis	G03.0
  Asia southeast asia hemorrhagic fever	A97.0
  Aspergillosis	B44.9
  Aspermia	N46
  Asphyxia	R09.0
  Asphyxiation	T71
  Asphyxiation by drowning	T75.1
  Aspirated pneumonia	J69.0
  Aspiration pneumonia	J69.0
  Asplenia	Q89.0
  Assisted delivery	na
  Asthenia	R53
  Asthma	J45.9
  Asthmatic attack	J45.9
  Asthmatic bronchitis	J45.9
  Asthmatic dyspnea	J45.9
  Astigmatism	H52.2
  Asymptomatic bacteriuria	N39.0
  Asymptomatic HIV (HIV-test positive)	Z21
  Asymptomatic HIV infection	Z21
  Asymptomatic HIV infection status	Z21
  Asymptomatic human immunodeficiency virus infection status	Z21
  Asymptomatic hyperuricaemia	E79.0
  Asynergia	R27.8
  Ataxia	R27.0
  Atelectasis	J98.1
  Atheromatosis	I70.9
  Atherosclerosis	I70.9
  Atherosclerotic heart disease	I25.1
  Athlete's foot	B35.3
  Atopic dematitis	L20.9
  Atrial fibrillation	I48.9
  Atrial flutter	I48.9
  Atrioventricular canal defect	Q21.2
  Atrioventricular septal defect	Q21.2
  Atrophic disorder of skin	L90.9
  Attention to artificial openings	Z43.9
  Attention to colostomy	Z43.3
  Attention to cystostomy	Z43.5
  Attention to gastrostomy	Z43.1
  Attention to nephrostomy	Z43.6
  Attention to tracheostomy	Z43.0
  Attention to ureterostomy	Z43.6
  Attention to urethrostomy	Z43.6
  Atypical pneumonia	J18.9
  Auricle hematoma	S00.4
  Auricular hematoma	S00.4
  Autism	F84.0
  Autistic	F84.0
  Autistic disorder	F84.0
  Autoimmune disease	M35.9
  Autoimmune hemolytic anemia	D59.1
  Autoimmune hepatitis	K75.4
  Avascular necrosis of bone	M87.9
  Avitaminosis	E56.9
  Avulsion of scalp	S08.0
  Axillary contusion	S40.0
  Azoospermia	N46
  Azotemia	R79.8
  B cell lymphoma	C85.1
  Bacilluria	N39.0
  Back burn	T21.0
  Back pain	M54.9
  Backache	M54.9
  Bacteremia	A49.9
  Bacterial colitis	A04.9
  Bacterial conjunctivitis	H10.9
  Bacterial corneal ulcer	H16.0
  Bacterial enteritis	A04.9
  Bacterial enterocolitis	A04.9
  Bacterial food-borne intoxications	A05.9
  Bacterial meningitis	G00.9
  Bacterial pneumonia	J15.9
  Bacteriuria	N39.0
  Bad breath	R19.6
  Balanitis	N48.1
  Baldness	L65.9
  Barosinusitis	T70.1
  Barotitis	T70.0
  Barotrauma	T70.2
  Bartholinitis	N75.8
  Bartholin's abscess	N75.1
  Bartholin's gland abscess	N75.1
  Bartonellosis	A44.9
  Basal ganglia hemorrhage	I61.0
  Basal ganglia infarction	I63.8
  Baseball finger	S63.1
  Bbradyarrhythmia	I49.8
  BCG immunization	Z23.2
  Bedsore	L89.9
  Behavioral disorder screening	Z13.3
  Behcet's disease	M35.2
  Bell's palsy	G51.0
  Benign mammary dysplasia	N60.9
  Benign paroxysmal positional vertigo	H81.1
  Benign prostate gland hypertrophy	N40
  Benign prostatic hyperthophy	N40
  Beriberi	E51.1
  Beta thalassaemia	D56.1
  Beta thalassemia disease	D56.1
  Beta thalassemia syndrome	D56.1
  Beta thalassemia trait	D56.3
  Betalipoproteinemia	E78.2
  Bezoar	T18.9
  Biceps tendinitis	M75.2
  Bicipital tendinitis	M75.2
  Bilateral aseptic necrosis at hip	M87.0
  Bilateral carotid artery stenosis	I65.2
  Bilateral chronic subdural hemorrhage	I62.0
  Bilateral direct inguinal hernia	K40.2
  Bilateral excessive lateral pressure syndrome	M25.8
  Bilateral hernia	K40.2
  Bilateral indirect inguinal hernia	K40.2
  Bilateral inguinal hernia	K40.2
  Bilateral osteoarthritis knee	M17.9
  Bilateral osteoarthritis of knee	M17.9
  Bilateral otitis media with effusion	H66.9
  Bilateral otosclerosis	H80.9
  Bilateral primary gonarthrosis	M17.0
  Bilateral trigger thumb	M65.3
  Bilateral tubal occlusion	N97.1
  Biliary pancreatitis	K85.1
  Bilirubinemia	R79.8
  Bilirubinuria	R82.2
  Biomechanical lesion	M99.9
  Bird flu	J09
  Birth asphyxia	na
  Birth injury	na
  Birth injury to scalp	na
  Birthmark	Q82.5
  Bite by animal, venomous	T63.9
  Bite by sea-snake	T63.0
  Black eye	S00.1
  Blackout	R55
  Bladder calculi	N21.0
  Bladder calculus	N21.0
  Bladder disorder	N32.9
  Bladder retention	R33
  Bladder stone	N21.0
  Blastomycosis	B40.9
  Blebs	R23.8
  Bleeding	R58
  Bleeding from anus	K62.5
  Bleeding from ear	H92.2
  Bleeding from nose	R04.0
  Bleeding from vagina	N93.9
  Bleeding internal hameorrhoids	K64.9
  Bleeding per vagina	N93.9
  Bleeding tooth socket	T81.0
  Blepharitis	H01.0
  Blepharoconjunctivitis	H10.5
  Blepharoptosis	H02.4
  Blighted ovum	O02.0
  Blind	H54.0
  Blind eye	H54.0
  Blindness	H54.0
  Blindness of one eye	H54.4
  Blindness, binocular	H54.2
  Blindness, both eyes	H54.2
  Blindness, monocular	H54.4
  Blindness, one eye	H54.4
  Bloating	R14
  Blood in feces	K92.1
  Blood in stool	K92.1
  Blood in urine	R31
  Blood loss anemia	D50.0
  Blood pressure examination	Z01.3
  Blood pressure low, incidental reading, without diagnosis of hypotension	R03.1
  Blood pressure test	Z01.3
  Blood-stained sputum	R04.2
  Bloody stool	K92.1
  Body lice	B85.1
  Body temperature elevation	R50.9
  Body-louse infestation	B85.1
  Boil at abdominal wall	L02.2
  Boil at ankle	L02.4
  Boil at arm	L02.4
  Boil at back	L02.2
  Boil at breast	N61
  Boil at buttock	L02.3
  Boil at chest wall	L02.2
  Boil at ear	H60.0
  Boil at elbow	L02.4
  Boil at eyelid	H00.0
  Boil at face	L02.0
  Boil at finger	L02.4
  Boil at foot	L02.4
  Boil at forearm	L02.4
  Boil at hand	L02.4
  Boil at hip	L02.4
  Boil at knee	L02.4
  Boil at leg	L02.4
  Boil at neck	L02.1
  Boil at nose	J34.0
  Boil at scalp	L02.8
  Boil at shoulder	L02.4
  Boil at thigh	L02.4
  Boil at toe	L02.4
  Boil at wrist	L02.4
  Boil of eyelid	H00.0
  Bone tuberculosis	A18.0
  Botulism	A05.1
  Bowel habit change	R19.4
  Bowel ileus	K56.7
  Bowleg (s)	M21.1
  BPH - benign prostatic hypertrophy	N40
  Brachial plexus injury	S14.3
  Brachycephaly	Q75.0
  Bradycardia	R00.1
  Bradypnea	R06.8
  Brain abscess	G06.0
  Brain injury	S06.9
  Brain stem stroke syndrome	I67.9
  Branchial cleft cyst	Q18.0
  Breast abscess	N61
  Breast engorgement in newborn	na
  Breast engorgement, puerperal, postpartum	na
  Breast feeding jaundice	na
  Breast irregular nodularity	N63
  Breast lump	N63
  Breast lymphangitis, gestational	na
  Breast mass	N63
  Breast milk jaundice	na
  Breast neoplasm screening	Z12.3
  Breast node	N63
  Breast pain	N64.4
  Breath holding	R06.8
  Breath shortness of breath	R06.0
  Breech presemtation	na
  Broken arm	T10
  Broken leg	T12
  Broken teeth	S02.5
  Bronchial asthma	J45.9
  Bronchiectasis	J47
  Bronchiolectasis	J47
  Bronchiolitis	J21.9
  Bronchitis	J40
  Bronchitis	J40
  Bronchitis in those under 15 years of age	J20.9
  Bronchitis in those under l5 years of age	J20.9
  Bronchitis mucopurulent, acute or subacute	J20.9
  Bronchitis, in those under l5 years of age	J20.9
  Broncholithiasis	J98.0
  Bronchomalacia	J98.0
  Bronchomycosis	B49
  Bronchopneumonia	J18.0
  Bronchopneumonitis	J18.0
  Bronchopulmonary dysplasia	P27.1
  Bronchopulmonitis	J18.0
  Bronchorrhea	J98.0
  Bronchospasm	J98.0
  Bronchostenosis	J98.0
  Brucellosis	A23.9
  Bruise at ankle	S90.0
  Bruise at anterior abdomen	S30.1
  Bruise at anterior chest	S20.3
  Bruise at arm (upper)	S40.0
  Bruise at axilla	S40.0
  Bruise at back, lower	S30.0
  Bruise at back, upper	S20.2
  Bruise at breast	S20.0
  Bruise at brow	S00.8
  Bruise at buttock	S30.0
  Bruise at cheek	S00.8
  Bruise at chest wall	S20.8
  Bruise at chin	S20.0
  Bruise at ear	S00.4
  Bruise at elbow	S50.0
  Bruise at eyelid	S00.2
  Bruise at face	S00.8
  Bruise at finger	S60.0
  Bruise at flank	S30.0
  Bruise at foot	S90.3
  Bruise at forearm	S50.1
  Bruise at forehead	S00.8
  Bruise at groin	S30.1
  Bruise at hand	S60.2
  Bruise at head	S00.8
  Bruise at heal	S90.3
  Bruise at hip	S70.0
  Bruise at knee	S80.0
  Bruise at lip	S00.5
  Bruise at lower leg	S80.1
  Bruise at mouth	S00.5
  Bruise at neck	S10.9
  Bruise at nose	S00.3
  Bruise at penis	S30.2
  Bruise at perineum	S30.2
  Bruise at scalp	S00.0
  Bruise at scrotum	S30.2
  Bruise at shoulder	S40.0
  Bruise at thigh	S70.1
  Bruise at thumb	S60.0
  Bruise at toe	S90.1
  Bruise at vagina	S30.2
  Bruise at vulva	S30.2
  Bruise at wrist	S60.2
  Bubo	I88.8
  Buccal cellulitis	K12.2
  Bulbous urethral injury	S37.3
  Bulbous urethral stricture	N35.9
  Bulimia	F50.2
  Bulimia nervosa	F50.2
  Bullous disorder	L13.9
  Bullous impetigo	L01.0
  Bullous impetigo of the napkin area	L01.0
  Bundle branch block	I45.4
  Bunion	M20.1
  Burkitt╚├═s lymphoma	C83.7
  Burn of abdominal wall	T21.0
  Burn of ankle	T25.0
  Burn of arm [any part, except wrist and hand alone]	T22.0
  Burn of axilla	T22.0
  Burn of back [any part]	T21.0
  Burn of breast	T21.0
  Burn of buttock	T21.0
  Burn of chest wall	T21.0
  Burn of ear	T20.0
  Burn of ear drum	T20.0
  Burn of esophagus	T28.1
  Burn of eye and adnexa	T26.0
  Burn of eye with other parts of face, head and neck	T20.0
  Burn of eyelid and periocular area	T26.0
  Burn of face	T20.0
  Burn of face except eye and adnexa	T20.0
  Burn of finger (nail)	T23.0
  Burn of flank	T21.0
  Burn of foot	T25.0
  Burn of groin	T21.0
  Burn of hand	T23.0
  Burn of head	T20.0
  Burn of head and neck except face	T20.0
  Burn of hip	T24.0
  Burn of hip and leg, except ankle and foot	T24.0
  Burn of interscapular region	T21.0
  Burn of knee	T24.0
  Burn of leg [any part, except ankle and foot alone]	T24.0
  Burn of lip	T20.0
  Burn of lower limb	T24.0
  Burn of lower limb(s)	T24.0
  Burn of mouth	T28.0
  Burn of neck	T20.0
  Burn of nose [septum]	T20.0
  Burn of palm	T23.0
  Burn of perineum and genitalia	T21.0
  Burn of scalp [any part]	T20.0
  Burn of scapular region	T22.0
  Burn of shoulder	T22.0
  Burn of shoulder and arm, except wrist and hand	T22.0
  Burn of temple (region)	T20.0
  Burn of thigh	T24.0
  Burn of thumb (nail)	T23.0
  Burn of toe(s)	T25.0
  Burn of trunk except perineum and genitalia	T21.0
  Burn of upper limb	T22.0
  Burn of wrist	T23.0
  Burn of wrist and hand	T23.0
  Burned mouth	T28.0
  Burn-out	Z73.0
  Bursitis	M71.9
  Buttock burn	T21.0
  Buttock contusion	S30.0
  CA - cancer	C80.9
  CA - disseminated cancer	C79.9
  CA - secondary cancer	C79.9
  Cachexia	R64
  Cachexia cancer	C80.9
  Calcaneus fracture	S92.0
  Calcificaion and ossificaion of muscle	M61.9
  Calcinosis	E83.5
  Calculus of bile duct	K80.5
  Calculus of kidney	N20.0
  Calculus of lower urinary tract	N21.9
  Calculus of ureter	N20.1
  Callus	L84
  Camptodactyly	Q68.1
  Cancer	C80.9
  Cancer phobia counselling	Z71.1
  Candidiasis	B37.9
  Candidosis	B37.9
  Cannabinosis	J66.2
  Capillariasis	B81.1
  Caput succidaneum	na
  Car sickness	T75.3
  Carate	A67.9
  Carbuncle at abdominal wall	L02.2
  Carbuncle at ankle	L02.4
  Carbuncle at arm	L02.4
  Carbuncle at back	L02.2
  Carbuncle at breast	N61
  Carbuncle at buttock	L02.3
  Carbuncle at chest wall	L02.2
  Carbuncle at ear	H60.0
  Carbuncle at elbow	L02.4
  Carbuncle at eyelid	H00.0
  Carbuncle at face	L02.0
  Carbuncle at finger	L02.4
  Carbuncle at foot	L02.4
  Carbuncle at forearm	L02.4
  Carbuncle at hand	L02.4
  Carbuncle at hip	L02.4
  Carbuncle at knee	L02.4
  Carbuncle at leg	L02.4
  Carbuncle at lower back	L02.2
  Carbuncle at neck	L02.1
  Carbuncle at nose	J34.0
  Carbuncle at scalp	L02.8
  Carbuncle at shoulder	L02.4
  Carbuncle at thigh	L02.4
  Carbuncle at toe	L02.4
  Carbuncle at wrist	L02.4
  Carbuncle eyelid	H00.0
  Carbuncle nose	J34.0
  Carbuncle of nose	J34.0
  Carbuncle of the neck	L02.1
  Carcinoma unspecified site primary	C80.9
  Carcinomatosis unspecified site (secondary)	C79.9
  Cardiac arrest	I46.9
  Cardiac arrhythmia	I49.9
  Cardiac beriberi	E51.1
  Cardiac septal defect	I51.0
  Cardiac tamponade	I31.9
  Cardio embolic stroke	I63.8
  Cardioembolic stroke	I63.8
  Cardiogenic shock	R57.0
  Cardiomegaly	I51.7
  Cardiomyopathy	I42.9
  Cardiopathy	I42.9
  Cardiospasm	K22.0
  Cardiostenosis	I51.8
  Carditis	I51.8
  Care and examination immediately after delivery	na
  Care and examination of lactating mother	na
  Care in home, lack of	Z74.2
  Carotid aneurysm	I72.0
  Carotid artery aneurysm	I72.0
  Carotid stenosis	I77.1
  Carpal dislocation	S63.0
  Carpal tunnel syndrome	G56.0
  Carrier of tuberculosis	Z22.8
  Carrier of typhoid	Z22.0
  Carrier of unspecified viral hepatitis	Z22.8
  Carrier of viral hepatitis	Z22.8
  Carrier or suspected carrier of typhoid	Z22.0
  Caruncle at urethra	N36.2
  Castration	S38.2
  Catalepsy	F44.2
  Cataplexy	G47.4
  Cataract	H26.9
  Cataract screening	Z13.5
  Catarrh	J00
  Catarrh nasopharyngeal, acute	J00
  Catarrhal inflammation	J00
  Catatonia	F20.2
  Causalgia	G56.4
  Cavernositis	N48.2
  Cavernous sinus thrombosis	G08
  Cavitation of lung	A16.9
  Cecal ulcer	K63.3
  Cecitis	K52.9
  Cellulitis at abdominal wall	L03.3
  Cellulitis at ankle	L03.1
  Cellulitis at arm	L03.1
  Cellulitis at auricle	H60.1
  Cellulitis at back	L03.3
  Cellulitis at breast	L03.3
  Cellulitis at buttock	L03.3
  Cellulitis at chest wall	L03.3
  Cellulitis at ear	H60.1
  Cellulitis at elbow	L03.1
  Cellulitis at external auditory canal	H60.1
  Cellulitis at external ear	H60.1
  Cellulitis at external nose	J34.0
  Cellulitis at eyelid	H00.0
  Cellulitis at face	L03.2
  Cellulitis at finger	L03.0
  Cellulitis at foot	L03.1
  Cellulitis at forearm	L03.1
  Cellulitis at hand	L03.1
  Cellulitis at hip	L03.1
  Cellulitis at knee	L03.1
  Cellulitis at leg	L03.1
  Cellulitis at mouth	K12.2
  Cellulitis at neck	L03.8
  Cellulitis at nose	J34.0
  Cellulitis at penis	N48.2
  Cellulitis at scalp	L03.8
  Cellulitis at shoulder	L03.1
  Cellulitis at thigh	L03.1
  Cellulitis at toe	L03.0
  Cellulitis at wrist	L03.1
  Cellulitis eyelid	H00.0
  Central corneal ulcer	H16.0
  Central retinal artery occlusion	H34.2
  Central retinal vein occlusion	H34.8
  Cephalgia	R51
  Cephalhaematoma due to birth injury	na
  Cephalhematoma fetus or newborn	na
  Cephalopelvic disproportion	na
  Cerebellitis	G04.9
  Cerebral artery occlusion	I66.9
  Cerebral concussion	S06.0
  Cerebral contusion	S06.2
  Cerebral edema	G93.6
  Cerebral infarction	I63.9
  Cerebral palsy	G80.9
  Cerebritis	G04.9
  Cerebrospinal fluid leak	G96.0
  Cerebrovascular accident	I64
  Cerebrovascular disease	I67.9
  Cerumen impaction	H61.2
  Cervical disc disorder	M50.9
  Cervical incompetence	N88.3
  Cervical lymphadenopathy	R59.0
  Cervical spondylosis	M47.8
  Cervical spondylosis myelopathy	M47.1
  Cervical tear	N88.1
  Cervicalgia	M54.2
  Cervicitis	N72
  Chalazion	H00.1
  Chancre	A51.0
  Chancroid	A57
  Chancroidal lymphadenitis	A57
  Change of bowel habit	R19.4
  Change of dressings	Z48.0
  Change suture	Z48.0
  Checking IUD	Z30.5
  Checking of intrauterine device	Z30.5
  Checking, reinsertion or removal of (intrauterine) contraceptive device	Z30.5
  Check-up	Z00.0
  Check-up health	Z00.0
  Check-up health, occupational	Z10.0
  Check-up infant or child	Z00.1
  Cheilodynia	K13.0
  Cheilosis	K13.0
  Chest contusion	S20.2
  Chest injury	S29.9
  Chest pain	R07.4
  Chest pain on breathing	R07.1
  Chest wall contusion	S20.2
  Chicken pox	B01.9
  Chickenpox	B01.9
  Chignon	na
  Chignon due to birth injury	na
  Chikungunya (hemorrhagic) fever	A92.0
  Child abuse	T74.9
  Child psychosis	F84.0
  Childhood disorder of social functioning	F94.9
  Childhood emotional disorder	F93.9
  Chills	R68.8
  Chlamydial lymphogranuloma venereum	A55
  Chlamydial pneumonia	J16.0
  Chlamydiosis	A74.9
  Chloasma	L81.1
  Choking	R06.8
  Cholangiectasis	K83.8
  Cholangiocarcinoma	C22.1
  Cholangiocarcinoma, unspecified site	C22.1
  Cholangiolitis	K83.0
  Cholangitis	K83.0
  Cholecystitis	K81.9
  Cholecystolithiasis	K80.2
  Choledocholithiasis	K80.5
  Cholelithiasis	K80.2
  Cholera	A00.9
  Cholera + TAB immunization	Z27.0
  Cholera contact	Z20.0
  Cholestasis	K83.1
  Cholesteatoma	H71
  Cholesterolemia	E78.0
  Chondritis	M94.8
  Chondrocalcinosis	M11.2
  Chondrodermatitis	H61.0
  Chondrodysplasia	Q78.9
  Chondrodystrophy	Q78.9
  Chondrolysis	M94.3
  Chondromalacia	M94.2
  Chordee	N48.8
  Chorditis	J38.2
  Chorea	G25.5
  Chorioamnionitis	na
  Chorioangioma	na
  Chorioencephalitis	A87.2
  Choriomeningitis	A87.2
  Chorioretinitis	H30.9
  Choroidal detachment	H31.4
  Choroiditis	H30.9
  Choroidopathy	H31.9
  Chromomycosis	B43.9
  Chronic (viral) hepatitis B without delta agent	B18.1
  Chronic abscess at areola	N61
  Chronic adenotonsillitis	J35.0
  Chronic alcoholism	F10.2
  Chronic anal fissure	K60.2
  Chronic angle closure glaucoma	H40.2
  Chronic anterior shoulder dislocation	M24.4
  Chronic arterial occlusion	I74.9
  Chronic blood loss anemia	D50.0
  Chronic bronchitis	J42
  Chronic bursitis	M71.9
  Chronic cholecystis	K81.1
  Chronic constipation	K59.0
  Chronic cough	R05
  Chronic diarrhea	K52.9
  Chronic diffuse gastritis	K29.4
  Chronic gastritis	K29.4
  Chronic gingivitis	K05.1
  Chronic hallucinatory psychosis	F28
  Chronic HBV infection	B18.1
  Chronic headache	R51
  Chronic hemorrhagic anemia	D50.0
  Chronic hepatitis	K73.9
  Chronic hepatitis B	B18.1
  Chronic hepatitis C	B18.2
  Chronic hypertrophic adenotonsillitis	J35.0
  Chronic hypertrophic tonsillitis	J35.0
  Chronic instability of knee	M23.5
  Chronic iron deficiency anemia secondary to blood loss	D50.0
  Chronic kidney disease	N18.9
  Chronic lymphocytic leukaemia	C91.1
  Chronic myeloid leukaemia	C92.1
  Chronic nephritic syndrome	N03.9
  Chronic obstructed airway	J44.9
  Chronic obstructive airway	J44.9
  Chronic obstructive airway disease	J44.9
  Chronic obstructive lung disease	J44.9
  Chronic obstructive pulmonary disease	J44.9
  Chronic obstructive pulmonary disease exacerbation	J44.9
  Chronic obstructive pulmonary disease with acute exacerbation	J44.1
  Chronic obstructive pulmonary disease with acute lower respiratory infection	J44.0
  Chronic osteomyelitis	M86.6
  Chronic otitis externa	H60.8
  Chronic otitis media	H66.9
  Chronic pain	R52.2
  Chronic pancreatitis	K86.1
  Chronic periodontitis	K05.3
  Chronic pharyngitis	J02.9
  Chronic posthaemorrhagic Anemia	D50.0
  Chronic prostatitis	N41.1
  Chronic pyelonephritis	N11.9
  Chronic rash	R21
  Chronic recurrent tonsilitis	J03.9
  Chronic renal failure	N18.9
  Chronic rhinosinusitis	J32.9
  Chronic salpingitis	N70.1
  Chronic sinusitis	J32.9
  Chronic subdural hematoma	I62.0
  Chronic tonsillitis	J35.0
  Chronic transaminitis hepatitis	K73.8
  Chronic type b viral hepatitis	B18.1
  Chronic ulcer of skin	L98.4
  Chronic venous insufficiency	I87.2
  Chronic viral hepatitis b	B18.1
  Chronic viral hepatitis c	B18.2
  Chronic viral hepatitis, unspecified	B18.9
  Chronic wound	L98.4
  Chylocele	I89.8
  Chylothorax	I89.8
  Cicatrical alopecia	L66.9
  Cicatrix	L90.5
  Cirrhosis	K74.6
  Cirrhosis of liver	K74.6
  Classic migraine	G43.9
  Classical cholera	A00.9
  Classical dengue	A97.9
  Classical dengue fever	A97.9
  Classical migraine	G43.9
  Classical scabies	B86
  Claudication	I73.9
  Claustrophobia	F40.2
  Clavicle fracture	S42.0
  Clawfoot	M21.5
  Clawhand	M21.5
  Clawtoe	M21.8
  Cleft lip	Q36.9
  Cleft lip with cleft palate	Q37.9
  Cleft lip without cleft palate, bilateral	Q36.0
  Cleft lip without cleft palate, unilateral	Q36.9
  Cleft lip, bilateral	Q36.0
  Cleft lip, cleft palate	Q37.9
  Cleft lip, unilateral	Q36.9
  Cleft lip/palate	Q37.9
  Cleft palate	Q35.9
  Cleft soft palate	Q35.3
  Clicking hip	R29.4
  Clonorchiasis	B66.1
  Closed loop small bowel obstruction	K56.6
  Closed nasal bone fracture	S02.2
  Clubfinger	R68.3
  Clubfoot	Q66.8
  Clubhand	Q71.4
  Clubnail	R68.3
  Cluster headache	G44.0
  Coagulopathy	D68.9
  Coalworker's pneumoconiosis	J60
  Coarctation of aorta	Q25.1
  Coccydioidomycosis	B38.9
  Coitus pain, female	N94.1
  Coitus painful	N94.1
  Cold	J00
  Cold abscess	A16.2
  Cold virus	J00
  Coldness, exposure to	T69.9
  Colitis	A09.9
  Collagen vascular disease	M35.9
  Colon polyp	K63.5
  Colonic polyp	K63.5
  Color blindness	H53.5
  Colostomy status	Z93.3
  Colour blindness	H53.5
  Coma	R40.2
  Comedo	L70.0
  Common bile duct dilation	K83.8
  Common bile duct stone	K80.5
  Common cold	J00
  Common femeral vein thrombosis	I80.1
  Common iliac aneurysm	I72.3
  Common migraine	G43.9
  Common peroneal nerve palsy	G57.3
  Common variable immunodeficiency	D83.9
  Common warts	B07
  Community acquired pneumonia	J18.9
  Complete abortion	O06.9
  Complete deafness	H91.9
  Complete gut obstruction	K56.6
  Complete heart block	I44.2
  Complete single ventricle	Q20.4
  Complete small bowel obstruction	K56.6
  Complex febrile convulsion	R56.0
  Complex febrile seizure	R56.0
  Complex fistula in ano	K60.3
  Complicated labour or delivery with livebirth	na
  Complicated labour or delivery with stillbirth	na
  Complication of cardiac and vascular prosthetic device, implant and graft	T82.9
  Complication of genitourinary prosthetic device, implant and graft	T83.9
  Complication of internal orthopedic prosthetic device, implant and graft	T84.9
  Complication of internal prosthetic device, implant and graft	T85.9
  Complication of procedure	T81.9
  Complications of amputation stump	T87.6
  Compound depressed skull fracture	S02.9
  Conduct disorder	F91.9
  Condyloma	A63.0
  Condyloma acuminata	A63.0
  Condyloma latum	A51.3
  Condylomata acuminata	A63.0
  Condylomata acuminata of penis	A63.0
  Condylomata acuminata of perianal skin	A63.0
  Condylomata acuminata of vulva	A63.0
  Condylomata lata	A51.3
  Conflict counsellor	Z64.4
  Confusion	R41.0
  Congenital artrial septal defect	Q21.1
  Congenital esotropia	Q15.8
  Congenital exotropia	Q15.8
  Congenital flexion contracture	Q66.8
  Congenital heart disease	Q24.9
  Congenital hydrocephalus	Q03.9
  Congenital ptosis both eye	Q10.0
  Congenital iodine deficiency syndrome	E00.9
  Congenital ptosis	Q10.0
  Congestive heart failure	I50.0
  Conjunctiva contusion	S05.0
  Conjunctiva hemorrhage	H11.3
  Conjunctival ecchymosis	H11.3
  Conjunctival hemorrhage, unspecified eye	H11.3
  Conjunctival or subconjunctival haemorrhage	H11.3
  Conjunctival scar	H11.2
  Conjunctival scarring	H11.2
  Conjunctival scars	H11.2
  Conjunctivitis	H10.9
  Constipation	K59.0
  Contact communicable disease, sexually transmitted	Z20.2
  Contact dermatitis	L25.9
  Contact german measles	Z20.4
  Contact infection intestinal	Z20.0
  Contact infection sexually transmitted	Z20.2
  Contact intestinal infectious disease	Z20.0
  Contact parasitic disease	Z20.7
  Contact pediculosis	Z20.7
  Contact sexually transmitted disease	Z20.2
  Contact with and exposure to communicable diseases, unspecified	Z20.9
  Contact with and exposure to infections with a predominantly sexual mode of transmission	Z20.2
  Contact with and exposure to intestinal infectious diseases	Z20.0
  Contact with and exposure to pediculosis, acariasis and other infestations	Z20.7
  Contact with and exposure to rabies	Z20.3
  Contact with and exposure to rubella	Z20.4
  Contact with and exposure to tuberculosis	Z20.1
  Contact with and exposure to viral hepatitis	Z20.5
  Contact with or exposure to rabies	Z20.3
  Contact with or exposure to rubella	Z20.4
  Contact with or exposure to tuberculosis	Z20.1
  Contraception advice	Z30.0
  Contraception counseling	Z30.0
  Contraception postcoital	Z30.0
  Contraception prescription	Z30.0
  Contraceptive counseling	Z30.0
  Contraceptive management	Z30.9
  Contraceptive removal device	Z30.5
  Contraceptive surveillance device (intrauterine)	Z30.5
  Contracted pelvic	M95.5
  Controlled diabetes	E14.9
  Controlled diabetes mellitus	E14.9
  Controlled diabetic	E14.9
  Controlled diabetic mellitus	E14.9
  Contusion axilla	S40.0
  Contusion nail, finger	S60.1
  Contusion nail, toe	S90.2
  Contusion of abdominal wall	S30.1
  Contusion of ankle	S90.0
  Contusion of anterior abdomen	S30.1
  Contusion of anterior chest	S20.3
  Contusion of breast	S20.0
  Contusion of buttock	S30.0
  Contusion of chest	S20.2
  Contusion of chest wall	S20.2
  Contusion of elbow	S50.0
  Contusion of eyeball	S05.1
  Contusion of eyelid	S00.1
  Contusion of finger	S60.0
  Contusion of finger with damage to nail	S60.1
  Contusion of finger without damage to nail	S60.0
  Contusion of finger(s) NOS	S60.0
  Contusion of flank	S30.1
  Contusion of forearm	S50.1
  Contusion of genital organs	S30.2
  Contusion of groin	S30.1
  Contusion of hand	S60.2
  Contusion of heel	S90.3
  Contusion of hip	S70.0
  Contusion of knee	S80.0
  Contusion of labium (majus)(minus)	S30.2
  Contusion of labium majus	S30.2
  Contusion of labium minus	S30.2
  Contusion of lower back	S30.0
  Contusion of neck	S10.9
  Contusion of penis	S30.2
  Contusion of perineum	S30.2
  Contusion of scalp	S00.0
  Contusion of scapular region	S40.0
  Contusion of scrotum	S30.2
  Contusion of shoulder	S40.0
  Contusion of thigh	S70.1
  Contusion of thumb	S60.0
  Contusion of thumb with damage to nail	S60.1
  Contusion of toe	S90.1
  Contusion of toe without damage to nail	S90.1
  Contusion of upper arm	S40.0
  Contusion of vulva	S30.2
  Contusion of wrist	S60.2
  Contusion periocular area	S00.1
  Contusion upper arm	S40.0
  Contusion, breast	S20.0
  Contusion, eyeball	S05.1
  Contusion, lower leg	S80.1
  Contusion, toe	S90.1
  Convalescence	Z54.9
  Convulsions	R56.8
  Cor pulmonale	I27.9
  Cord compression	G95.2
  Corn	L84
  Cornea ulcer	H16.0
  Corneal Abrasion at	S05.0
  Corneal laceration	S05.8
  Corneal scar	H17.9
  Corneal ulcer	H16.0
  Corneal ulceration	H16.0
  Coronary artery aneurysm	I25.4
  Coronary artery disease	I25.1
  Corpus luteum cyst	N83.1
  Corrosion arm	T22.4
  Corrosion cornea	T26.6
  Corrosion esophagus	T28.6
  Corrosion eye	T26.9
  Corrosion eyelid	T26.5
  Corrosion foot	T25.4
  Corrosion hand	T23.4
  Corrosion head	T20.4
  Corrosion in mouth	T28.5
  Corrosion leg(s)	T24.4
  Corrosion trunk	T21.4
  Corrosive agent ingestion	T54.9
  Corrosive detergent ingestion	T54.1
  Corrosive esophageal injury	K22.1
  Corrosive esophagitis	K22.1
  Corrosive esophagogastriitis	K22.1
  Corrosive ingestion	T54.1
  Coryza	J00
  Coryza (acute)	J00
  Cough	R05
  Cough with haemorrhage	R04.2
  Counseling	Z71.9
  Cow milk protein allergy	K52.2
  Coxalgia	M25.5
  Coxarthrosis	M16.9
  CP - cerebral palsy	G80.9
  Crab lice	B85.3
  Crab-louse infestation	B85.3
  Cramp(s)	R25.2
  Craniopharyngioma	D44.4
  Cranioschisis	Q75.8
  Craniostenosis	Q75.0
  Craniosynostosis	Q75.0
  Crib death	R95
  Criminal abortion	O05.9
  Crohn's disease	K50.9
  Croup	J05.0
  Croup bronchial	J20.9
  Crush injury of toe	S97.1
  Crush injury, face	S07.0
  Crushing injury face	S07.0
  Crushing injury of ankle	S97.0
  Crushing injury of fingers	S67.0
  Crushing injury of foot	S97.8
  Crushing injury of forearm	S57
  Crushing injury of hand	S67.8
  Crushing injury of head	S07.9
  Crushing injury of hip	S77.0
  Crushing injury of knee	S87.0
  Crushing injury of lower leg	S87.8
  Crushing injury of neck	S17.9
  Crushing injury of shoulder and upper arm	S47
  Crushing injury of thigh	S77.1
  Crushing injury of thumb	S67.0
  Crushing injury of toe	S97.1
  Crushing injury of toes	S97.1
  Crushing injury of wrist and hand	S67.8
  Crusted scabies	B86
  Cryptitis	K62.8
  Cryptococcal meningitis	B45.1
  Cryptococcosis	B45.9
  Cryptorchidism	Q53.9
  Cryptosporidiosis	A07.2
  Crystal arthropathy	M11.9
  Cubital tunnel syndrome	G56.2
  Cubitus varus	M21.1
  Cubitus vulgus	M21.0
  Culture shock	F43.2
  Cushing disease	E24.9
  Cushing syndrome	E24.9
  Cushing's syndrome	E24.9
  Cutaneous cysts	L72.9
  Cutaneous tuberculosis	A18.4
  Cyanosis	R23.0
  Cyclic vomitting	R11
  Cyclitis	H20.9
  Cyclothymia	F34.0
  Cyst eyelid, infected	H00.0
  Cyst of breast	N60.0
  Cyst of oral region	K09.9
  Cyst of the thyroid gland	E04.1
  Cyst of thyroid	E04.1
  Cyst, breast	N60.0
  Cystic disease of breast	N60.1
  Cystic fibrosis	E84.9
  Cystic goiter	E04.2
  Cystic hygroma	D18.1
  Cysticercosis	B69.9
  Cystitis	N30.9
  Cystolithiasis	N21.0
  Cystostomy status	Z93.5
  Cystourethritis	N34.2
  Cystourethrocele, female	N81.1
  Cystourethrocele, male	N32.8
  Cytomagalovirus anterior uveitis	B25.8
  Cytomegaloviral disease	B25.9
  Cytomegaloviral retinitis	B25.8
  Cytomegalovirus retinitis	B25.8
  Dacryoadenitis	H04.0
  Dacryocystitis	H04.3
  Dacryocystocele	H04.6
  Dacryopericystitis	H04.3
  Dandruff	L21.0
  Dandy fever	A97.1
  Dandy walker syndrome	Q03.1
  Dead fetus in utero	na
  Deaf	H91.9
  Deafness	H91.9
  Death	R99
  Death - cause unknown	R99
  Death fetus in utero	na
  Death puerperal	na
  Death sudden, cause unknown, during childbirth	na
  Death sudden, during delivery	na
  Death sudden, puerperal, during puerperium	na
  Debility	R53
  Decreased heart rate	R00.1
  Decubitus pressure sore	L89.9
  Decubitus ulcer	L89.9
  Deep vein thrombosis	I80.2
  Deforming dorsopathy	M43.9
  Deformity nose, septum	J34.2
  Deformity of finger	M20.0
  Deformity of fingers	M20.0
  Deformity of forearm	M21.9
  Deformity of hand	M21.9
  Deformity of leg	M21.9
  Deformity of thumb	M20.0
  Degenerative diseases of nervous system	G31.9
  Dehiscence episiotomy	na
  Dehydration	E86
  Delayed milestones	R62.0
  Delayed postpartum haemorrhage	na
  Delayed union fracture	M84.2
  Delirium	F05.9
  Deliveries by vacuum extractor	na
  Delivery	na
  Delivery by combination of forceps and vacuum extractor	na
  Delivery by elective caesarean section	na
  Delivery by emergency caesarean section	na
  Delivery uncomplicated	na
  Delusions	F22.0
  Dementia	F03
  Dengue	A97.9
  Dengue fever	A97.9
  Dengue fever (DF)	A97.9
  Dengue fever [classical dengue]	A97.9
  Dengue fever with warning signs	A97.1
  Dengue fever without warning signs	A97.9
  Dengue haemorrhagic fever	A97.0
  Dengue haemorrhagic fever with warning signs	A97.1
  Dengue haemorrhagic fever without warning signs	A97.0
  Dengue hemorrhagic fever	A97.0
  Dengue shock syndrome	A97.2
  Dengue with warning signs	A97.1
  Dengue without warning signs	A97.9
  Dental caries	K02.9
  Dental examination	Z01.2
  Dental impaction	K01.1
  Dentofacial anomaly	K07.9
  Dependence on enabling machine and device	Z99.9
  Dependence on renal dialysis	Z99.2
  Dependence on respirator	Z99.1
  Dependence on wheelchair	Z99.3
  Depression	F32.9
  Depression screen	Z13.3
  Depression screening	Z13.3
  Deprivation of food	T73.0
  Deprivation of water	T73.1
  Dermatitis	L30.9
  Dermatographia	L50.3
  Dermatolysis	Q82.8
  Dermatomegaly	Q82.8
  Dermatomycosis	B36.9
  Dermatomyositis	M33.1
  Dermatoneuritis	T56.1
  Dermatophytosis	B35.9
  Dermatophytosis disseminated	B35.8
  Dermatophytosis of beard	B35.0
  Dermatophytosis of face	B35.8
  Dermatophytosis of fingernail	B35.1
  Dermatophytosis of foot	B35.3
  Dermatophytosis of groin	B35.6
  Dermatophytosis of hand	B35.2
  Dermatophytosis of nail	B35.1
  Dermatophytosis of perianal area	B35.8
  Dermatophytosis of scalp	B35.0
  Dermatophytosis of toenail	B35.1
  Dermatophytosis of trunk and limbs	B35.8
  Dermatopolymyositis	M33.9
  Dermatopolyneuritis	T56.1
  Dermatosclerosis	M34.9
  Dermatosis	L98.9
  Dermographia	L50.3
  Development testing of infant or child	Z00.1
  Deviated nasal septum	J34.2
  Dextrocardia	Q24.0
  Dextrotransposition of great arteries	Q20.3
  DHF- dengue hemorrhagic fever	A97.0
  DI - diabetes insipidus	E23.2
  Diabetes	E14.9
  Diabetes (mellitus) due to insulin secretory defect	E11.9
  Diabetes (mellitus)(nonobese)(obese) adult-onset	E11.9
  Diabetes (mellitus)(nonobese)(obese) maturity-onset	E11.9
  Diabetes (mellitus)(nonobese)(obese) nonketotic	E11.9
  Diabetes (mellitus)(nonobese)(obese) stable	E14.9
  Diabetes (mellitus)(nonobese)(obese) type II	E11.9
  Diabetes insipidus	E23.2
  Diabetes insulin dependent	E10.9
  Diabetes mellitus	E14.9
  Diabetes mellitus arising in pregnancy	na
  Diabetes mellitus in pregnancy	na
  Diabetes mellitus screen	Z13.1
  Diabetes mellitus screening	Z13.1
  Diabetes mellitus type 1	E10.9
  Diabetes mellitus type 2	E11.9
  Diabetes mellitus type I	E10.9
  Diabetes mellitus type II	E11.9
  Diabetes mellitus without mention of type	E14.9
  Diabetes nephropathy	E14.2
  Diabetes nephrosis	E14.2
  Diabetes of pregnancy	O24.4
  Diabetes, stable	E14.9
  Diabetic	E14.9
  Diabetic ketoacidosis	E14.1
  Diabetic mellitus	E14.9
  Diaper dermatitis	L22
  Diaphragmatic hernia	K44.9
  Diarrhea	A09.9
  Diarrheal disease	A09.9
  Diarrheal disorder	A09.9
  Diarrheal enteritis	A09.9
  Diarrhoea	A09.9
  Diarrhoea acute watery	A09.9
  Diarrhoea dysenteric	A09.9
  Diarrhoea epidemic	A09.9
  Diarrhoeal disease	A09.9
  Diarrhoeal disorder	A09.9
  Diastasis of cranial bones	M84.8
  Diataxia	G80.4
  DIB - difficulty in breathing	R06.0
  Diet counselling	Z71.3
  Diet or eating habits inappropriate	Z72.4
  Dietary calcium deficiency	E58
  Dietary selenium deficiency	E59
  Dietary zinc deficiency	E60
  Difficult breathing	R06.0
  Difficult swallowing	R13
  Difficult walking	R26.2
  Difficult feeding	R63.3
  Diffuse (colloid) nontoxic goiter	E04.0
  Diffuse goiter	E04.0
  Diffuse goitre	E04.0
  Diffuse large b cell lymphoma	C83.3
  Diffuse otitis externa	H60.3
  Diffuse thyroid goiter	E04.0
  Digitate warts	B07
  Dilated cardiomyopathy	I42.0
  Diphtheria	A36.9
  Diplopia	H53.2
  Disc herniation	M51.2
  Discharge from ear	H92.1
  Discharge from penis	R36
  Discharge of ear	H92.1
  Discharge urethra	R36
  Discharging ear	H92.1
  Discord with counselors	Z64.4
  Discord with landlord	Z59.2
  Discord with neighbors	Z59.2
  Discrimination religion	Z60.5
  Disease of Bartholin gland	N75.9
  Disease of digestive system	K92.9
  Disease of pancreas	K86.9
  Dislocated ankle	S93.0
  Dislocated elbow	S53.1
  Dislocated jaw	S03.0
  Dislocated knee	S83.1
  Dislocated wrist	S63.0
  Dislocation of ankle	S93.0
  Dislocation of ankle joint	S93.0
  Dislocation of big toe	S93.1
  Dislocation of cervical vertebra	S13.1
  Dislocation of elbow	S53.1
  Dislocation of elbow joint	S53.1
  Dislocation of finger	S63.1
  Dislocation of first toe	S93.1
  Dislocation of foot	S93.3
  Dislocation of great toe	S93.1
  Dislocation of hip	S73.0
  Dislocation of hip joint	S73.0
  Dislocation of knee	S83.1
  Dislocation of lens	H27.1
  Dislocation of lumbar vertebra	S33.1
  Dislocation of patella	S83.0
  Dislocation of phalanx of foot	S93.1
  Dislocation of phalanx, hand	S63.1
  Dislocation of shoulder	S43.0
  Dislocation of shoulder joint	S43.0
  Dislocation of temporomandibular joint	S03.0
  Dislocation of thoracic vertebra	S22.2
  Dislocation of thumb	S63.1
  Dislocation of toe joint	S93.1
  Dislocation of tooth	S03.2
  Dislocation of wrist	S63.0
  Dislocation wrist	S63.0
  Disorder equilibrium	R42
  Disorder of bone	M89.9
  Disorder of bone density and structure	M85.9
  Disorder of breast	N64.9
  Disorder of cartilage	M94.9
  Disorder of continuity of bone	M84.9
  Disorder of male genital organs	N50.9
  Disorder of muscle	M62.9
  Disorder of patella	M22.9
  Disorder of penis	N48.9
  Disorder of pigmentation	L81.9
  Disorder of prostate	N42.9
  Disorder of synovium and tendon	M67.9
  Disorder of urinary system	N39.9
  Disorientation	R41.0
  Disseminated cancer	C79.9
  Disseminated dermatophytosis	B35.8
  Disseminated intravascular coagulation	D65
  Disseminated malignancy	C79.9
  Disseminated malignant neoplasm	C79.9
  Dizziness	R42
  Dizziness - giddy	R42
  Dizziness and giddiness	R42
  DM - diabetes mellitus	E14.9
  Donovanosis	A58
  Dorsopathy	M53.9
  Dorsalgia	M54.9
  Double outlet left ventricle	Q20.2
  Double outlet right ventricle	Q20.1
  Down's syndrome	Q90.9
  Dracunculiasis	B72
  Drainage from external ear canal	H92.1
  Dressing change	Z48.0
  Dressing removal	Z48.0
  Driving licence medical examination	Z02.4
  Dropped dead	R96.0
  Drowned	T75.1
  Drowning	T75.1
  Drowning asphyxia	T75.1
  Drowsiness	R40.0
  Drug allergy	T88.7
  Drug induce hyponatremia	E87.1
  Drug induced myositis	M60.8
  Drug use	Z72.2
  Drug-induced hypoglycaemia without coma	E16.0
  Drug-induced hypoglycemia	E16.0
  Drunk	F10.0
  Drunkenness	F10.0
  DTP + polio immunization	Z27.3
  DTP + TAB immunization	Z27.2
  DTP immunization	Z27.1
  Duodenal obstruction	K31.5
  Duodenal ulcer	K26.9
  Duodenal ulcer bleeding	K26.4
  Duodenal ulcer perforation	K26.5
  Duodenitis	K29.8
  Duodenocholangitis	K83.0
  Duodenum perforation	K26.5
  Dupuytren's contracture	M72.0
  Dust allergy	J30.3
  Dust exposure	Z58.1
  Dwarfism	E34.3
  Dysarthria	R47.1
  Dysautonomia	G90.1
  Dysbasia	R26.2
  Dysentery	A09.0
  Dysfunctional uterine bleeding	N93.8
  Dyskinesia	G24.9
  Dyslexia	R48.0
  Dyslipidemia	E78.9
  Dysmenorrhea	N94.6
  Dysmenorrhoea	N94.6
  Dyspareunia	N94.1
  Dyspepsia	K30
  Dysphagia	R13
  Dysphasia	R47.0
  Dysphonia	R49.0
  Dysplasia of cervix uteri	N87.9
  Dyspnea	R06.0
  Dyspraxia	R27.8
  Dysproteinemia	E88.0
  Dysrhythmia	I49.9
  Dysthymia	F34.1
  Dystocia	na
  Dystonia	G24.9
  Dysuria	R30.0
  Eagle's syndrome	M89.8
  Ear ache	H92.0
  Ear burn	T20.0
  Ear deformity	H61.1
  Ear deformity acquired	H61.1
  Ear deformity, auricle, ear, acquired	H61.1
  Ear discharge	H92.1
  Ear discharge present	H92.1
  Ear hemorrhage	H92.2
  Ear pain	H92.0
  Ear, cellulitis	H60.1
  Earache	H92.0
  Earache nos	H92.0
  Earache symptom	H92.0
  Ear-lobe keloid	L91.0
  Early neonatal sepsis	na
  Early syphilis	A51.9
  Early postpatum hemorrhage	na
  Eating habits inadequate	Z72.4
  Ebola	A98.4
  Ecchymosis	R58
  Ecchymosis conjunctiva	H11.3
  Ecchymosis eye	S05.1
  Ecchymosis of eyelid	S00.1
  Echinococcosis	B67.9
  Eclampsia	na
  Eclampsia in labour	na
  Eclampsia in pregnancy	na
  Eclampsia in the puerperium	na
  Ecthyma	L08.0
  Ecthyma gangrenosum	L88
  Ectopic pregnancy	na
  Ectropion	H02.1
  Ectropion eyelid	H02.1
  Ectropion of eyelid	H02.1
  Ectropion, unspecified	H02.1
  Eczema	L30.9
  Eczema of external ear	H60.5
  Edema	R60.0
  Edema of legs	R60.9
  Edema of pregnancy	na
  Edematous laryngitis	J04.0
  Effects of lightning	T75.0
  Elbow deformity	M21.9
  Elbow dislocation	S53.1
  Electric shock	T75.4
  Electrical shock	T75.4
  Electricity shock	T75.4
  Elevated blood glucose level	R73.9
  Elevated blood-pressure reading, without diagnosis of hypertension	R03.0
  Embedded teeth	K01.0
  Embolism	I74.9
  Emphysema	J43.9
  Empyema gallbladder	K81.0
  Empyema thoracis	J86.9
  Encephalitis	G04.9
  Encephalocele	Q01.9
  Encephalomeningitis	G04.9
  Encephalomeningocele	Q01.9
  Encephalomeningomyelitis	G04.9
  Encephalomyelitis	G04.9
  Encephalomyelocele	Q01.9
  Encephalomyelomeningitis	G04.9
  Encephalopathy	G93.4
  Encopresis	R15
  End stage renal disease	N18.0
  Endarteritis	I77.6
  Endemic goiter	E01.2
  Endemic goitre (in part)	E01.2
  Endocarditis	I38
  Endocervicitis	N72
  Endocrine disorder	E34.9
  Endometriosis	N80.9
  Endometriosis of intestine	N80.5
  Endometriosis of ovary	N80.1
  Endometriotic cyst	N80.9
  Endometritis	N71.9
  Endophlebitis	I80.9
  Endophthalmia	H44.0
  Endophthalmitis	H44.0
  Enduring personality change	F62.9
  Enlarged lymph nodes	R59.9
  Enlarged thyroid gland	E04.9
  Enlarged thyroid glandular	E04.9
  Enlarged tonsils	J35.1
  Enlargement of lymph nodes	R59.9
  Enlargement of prostate	N40
  Enlargement of thyroid	E04.9
  Enlargement of tonsils	J35.1
  Enlargement tonsils	J35.1
  Enophthalmia	H05.4
  Enophthalmos	H05.4
  Enteric infected	A09.9
  Enteric infection	A09.9
  Enteritis	A09.9
  Enteritis of small intestine	A09.9
  Enteritis typhosa	A01.0
  Enterobiasis	B80
  Enterocele	K46.9
  Enterocolitis	A09.9
  Enterocolitis, inflammation involving both small intestine and colon	A09.9
  Enterogastritis	A09.9
  Enthesopathy of lower limb	M76.9
  Entropion	H02.0
  Entropion of eyelid	H02.0
  Enuresis	R32
  Epicondylitis, lateral	M77.1
  Epicondylitis, medial	M77.0
  Epidemic enteritis	A09.9
  Epidermal inclusion cyst	L72.0
  Epidermoid cyst	L72.0
  Epididymitis	N45.9
  Epididymo-orchitis	N45.9
  Epidural hematoma	S06.4
  Epidural hemorrhage	S06.4
  Epigastric pain	R10.1
  Epiglottitis	J05.1
  Epilepsy	G40.9
  Epipharyngitis	J00
  Epiphora	H04.2
  Episcleritis	H15.1
  Episiotomy infection	na
  Epispadias	Q64.0
  Epistaxis	R04.0
  Erosion and ectropion of cervix uteri	N86
  Erorive gastritis	K25.9
  Erosive esophagitis	K22.1
  Erosive gastroduodenitis	K25.9
  Erysipelas	A46
  Erysipelas of external ear	A46
  Erysipelas of face	A46
  Erysipelas of lower limb	A46
  Erysipeloid	A26.9
  Erythema	L53.9
  Erythema multiforme	L51.9
  Erythema nodosum	L52
  Erythroblastosis	na
  Erythrocytosis	D75.0
  Erythroderma	L53.9
  Esophageal nodules	K22.8
  Esophageal stenosis	K22.2
  Esophageal ulcer	K22.1
  Esophageal varices	I85.9
  Esophagitis	K20
  Esophoria	H50.5
  Esotropia	H50.0
  Essential cholesterolemia	E78.0
  Essential hypertension	I10
  Ethnic discrimination	Z60.5
  Eumycetoma	B47.0
  Eunuchoidism	E29.1
  Euthyroid goitre	E04.0
  Eversion of the eyelid	H02.1
  Examination and observation	Z04.9
  Examination annual, gynecological	Z01.4
  Examination for driving licence	Z02.4
  Examination for insurance purposes	Z02.6
  Examination for participation in sport	Z02.5
  Examination for recruitment to armed forces	Z02.3
  Examination health examination (general)	Z00.0
  Examination infant or child	Z00.1
  Examination lactating mother	Z39.1
  Examination medical, admission to, school	Z02.0
  Examination medical, insurance purposes	Z02.6
  Examination medical, sport	Z02.5
  Examination of ear	Z01.1
  Examination of eye	Z01.0
  Examination of eyes and vision	Z01.0
  Examination of skin	Z01.5
  Examination of teeth	Z01.2
  Examination pelvis	Z01.4
  Examination postpartum, immediately after delivery	na
  Exanthema subitum	B08.2
  Excess and redundant skin	R23.8
  Excessive sputum	R09.3
  Excessive vomiting in pregnancy	na
  Exfoliative dermatits	L26
  Exhaustion	R53
  Exhibitionism	F65.2
  Exocervicitis	N72
  Exomphalos	Q79.2
  Exophthalmia	H05.2
  Exophthalmic conditions	H05.2
  Exophthalmic goiter	E05.0
  Exophthalmic goitre	E05.0
  Exophthalmic or toxic goitre	E05.0
  Exophthalmos	H05.2
  Exophthalmos goiter	E05.0
  Exophthalmos, dysthyroid	E05.0
  Exotropia	H50.1
  Exposed to noise	Z58.0
  Exposed to noise (event)	Z58.0
  Exposure cholera	Z20.0
  Exposure discrimination	Z60.5
  Exposure german measles	Z20.4
  Exposure gonorrhea	Z20.2
  Exposure intestinal infectious disease	Z20.0
  Exposure rabies	Z20.3
  Exposure sexually transmitted disease	Z20.2
  Exposure soil pollution	Z58.3
  Exposure to air pollution	Z58.1
  Exposure to cholera	Z20.0
  Exposure to gonorrhea	Z20.2
  Exposure to noise	Z58.0
  Exposure to noise causing accidental injury	Z58.0
  Exposure to radiation	Z58.4
  Exposure to soil pollution	Z58.3
  Exposure to syphilis	Z20.0
  Exposure to tobacco smoke	Z58.7
  Exposure to water pollution	Z58.2
  External auditory canal, cellulitis	H60.1
  External ear abscess	H60.0
  External ear infection	H60.8
  External ear, cellulitis	H60.1
  External hirudiniasis	B88.3
  External hordeolum	H00.0
  External iliac occlusion	I74.8
  External nose abscess	J34.0
  Extragenital granuloma inguinale	A58
  Extrahepatic duct dilation	K83.8
  Extreme poverty	Z59.5
  Exudative pharyngitis	J02.9
  Exudative tonsillitis	J03.9
  Eye examination	Z01.0
  Eye laceration	S05.3
  Eye pain	H57.1
  Eye perforation, traumatic	S05.6
  Eye rupture	S05.3
  Eye(ball) laceration, penetrating	S05.6
  Eyelid abscess	H00.0
  Eyelid avulsion	S01.1
  Eyelid boil	H00.0
  Eyelid burn	T26.0
  Eyelid contusion	S00.1
  Eyelid corrosion	T26.5
  Eyelid laceration	S01.1
  Eyelids ptosis	H02.4
  Eyestrain	H53.1
  Eyeworm	B74.3
  Face burn	T20.0
  Face presentation	na
  Facial burn	T20.0
  Facial nerve injury	S04.5
  Facial Tic	F95.9
  Faecal incontinence	R15
  Failed forceps extraction	na
  Failed induction of labour	na
  Failed medical induction	na
  Failure and rejection of transplanted organ and tissue	T86.9
  Fainting	R55
  False labor pains	na
  False labour	na
  False labour before completed weeks of gestation	na
  False labour pain	na
  Family planning advice	Z30.0
  Farsighted	H52.0
  Farsightedness	H52.0
  Far-sightedness	H52.0
  Fasciculitis optica	H46
  Fasciitis	M72.9
  Fat embolism	T79.1
  Fat pad	E65
  Fatigue	R53
  Fatty liver	K76.0
  Fear of cancer	Z71.1
  Fear of cancer of skin	Z71.1
  Fear of death or dying	Z71.1
  Fear of disease	Z71.1
  Fear of disease, unspecified	Z71.1
  Fear of eye disease	Z71.1
  Fear of HIV	Z71.1
  Fear of skin disease	Z71.1
  Febrile catarrh	J00
  Febrile convulsion	R56.0
  Febrile neutropenia	D70
  Fecal impaction	K56.4
  Feeding and eating disorders	F50.9
  Feeding difficulty	R63.3
  Feeding problem	R63.3
  Feeding problem of adult	R63.3
  Feeding problem of child	R63.3
  Feeding problem of infant	R63.3
  Feeling ill	R69
  Felon	L03.0
  Female genital prolapse	N81.9
  Female genital tract fistula	N82.9
  Female infertility	N97.9
  Female pelvic inflammatory diseases	N73.9
  Femoral hernia	K41.9
  Fetal blood loss	na
  Fetal distrees	na
  Fetal haemorrhage	na
  Fetal hemorrhage	na
  Fever	R50.9
  Fever Aden	A97.9
  Fever Bangkok hemorrhagic	A97.0
  Fever dengue (virus), hemorrhagic	A97.0
  Fever of newborn	na
  Fibroadenoma of breast	D24
  Fibroadenoma of breast, unspecified	D24
  Fibroadenosis	N60.2
  Fibrocystic disease of breast	N60.1
  Fibroids, uterus	D25.9
  Fibromyoma of uterus	D25.9
  Filariasis	B74.9
  Filiform warts	B07
  Financial resources lack of	Z59.6
  Finger crushed	S67.0
  Finger crushing	S67.0
  Finger deformity	M20.0
  Finger dislocation	S63.1
  Finger fracture	S62.6
  Finger pain	M79.6
  Finger tip amputation	S68.1
  Finger tip injury	S68.1
  Finger(s) deformity	M20.0
  Finger(s) dislocation	S63.1
  First degree perineal laceration	S31.0
  First degree perineal tear during delivery	na
  First episode febrile convulsion	R56.0
  First episode unprovoke convulsion	R56.8
  First infection tuberculous	A16.9
  Fissure of nipple, gestational or puerperal	na
  Fistula in ano.	K60.3
  Fistula of bile duct	K83.3
  Fitting and adjustment of device	Z46.9
  Fitting and adjustment of external prosthetic device	Z44.9
  Flail chest	S22.5
  Flank burn	T21.0
  Flank contusion	S30.1
  Flashbacks	F19.7
  Flat warts	B07
  Flatulence	R14
  Flu	J11.1
  Fluid depletion	E86
  Fluid loss	E86
  Fluid overload	E87.7
  Fluid volume deficit	E86
  Fluid volume depletion	E86
  Fluke infection	B66.9
  Flushing	R23.2
  Focal epilepsy	G40.9
  Folate deficiency anemia	D25.9
  Follicular cysts of skin and subcutaneous tissue	L72.9
  Folliculitis	L73.9
  Follow-up care involving plastic surgery	Z42.9
  Follow-up examination after treatment for malignant neoplasm	Z08.9
  Food deprivation	T73.0
  Food poisoning	T62.9
  Food regurgitation	R11
  Foot absent (and ankle)	Z89.4
  Foot burn	T25.0
  Foot crushed	S97.8
  Foot injury	S99.9
  Foot pain	M79.6
  Foot sprain (strain)	S93.6
  Foot traumatic amputation	S98.4
  Foot ulcer	L97
  Forearm Abrasion at	S50.8
  Forearm deformity	M21.9
  Forearm injury	S59.9
  Foreign body hypopharynx	T18.8
  Foreign body in anus	T18.5
  Foreign body in bladder	T19.1
  Foreign body in colon	T18.4
  Foreign body in conjunctival sac	T15.1
  Foreign body in cornea	T15.0
  Foreign body in ear	T16
  Foreign body in genitourinary tract	T19.9
  Foreign body in mouth	T18.0
  Foreign body in nose	T17.1
  Foreign body in nostril	T17.1
  Foreign body in oesophagus	T18.1
  Foreign body in rectum	T18.5
  Foreign body in small intestine	T18.3
  Foreign body in stomach	T18.2
  Foreign body in throat	T17.2
  Foreign body in urethra	T19.0
  Foreign body in uterus	T19.3
  Foreign body in vulva or vagina	T19.2
  Foreign body ingestion	T18.9
  Foreign body on external eye	T15.9
  Found dead	R98
  Fracture dislocation of finger	S62.6
  Fracture floor of orbital	S02.8
  Fracture frontal bone	S02.0
  Fracture le fort	S02.4
  Fracture malunion	M84.0
  Fracture neck of femur	S72.0
  Fracture of acetabulum	S32.4
  Fracture of arm	T10
  Fracture of atlas	S12.0
  Fracture of axis	S12.1
  Fracture of bony thorax	S22.9
  Fracture of both bones of forearm	S52.4
  Fracture of both bones of leg	S82.2
  Fracture of carpal bone (except scaphoid)	S62.1
  Fracture of cervical spine	S12.9
  Fracture of clavicle	S42.0
  Fracture of coccyx	S32.2
  Fracture of distal end radius	S52.5
  Fracture of femur	S72.9
  Fracture of fibula	S82.4
  Fracture of finger	S62.6
  Fracture of first metacarpal bone	S62.2
  Fracture of foot	S92.9
  Fracture of forearm	S52.9
  Fracture of forearm, unspecified	S52.9
  Fracture of great toe	S92.4
  Fracture of humerus	S42.3
  Fracture of ilium	S32.3
  Fracture of lateral malleolus	S82.6
  Fracture of leg	T12
  Fracture of leg, level unspecified	T12
  Fracture of lower end of femur	S72.4
  Fracture of lower end of tibia	S82.3
  Fracture of lower jaw	S02.6
  Fracture of lower leg	S82.9
  Fracture of lower limb	T12
  Fracture of lumbar vertebra	S32.0
  Fracture of mandible	S02.6
  Fracture of maxilla	S02.4
  Fracture of medial malleolus	S82.5
  Fracture of metacarpal bone (except first metacarpal)	S62.3
  Fracture of metatarsal bone	S92.3
  Fracture of nasal bone	S02.2
  Fracture of nose	S02.2
  Fracture of patella	S82.0
  Fracture of pelvis	S32.8
  Fracture of phalanx of toe	S92.5
  Fracture of pubis	S32.5
  Fracture of sacrum	S32.1
  Fracture of scaphoid bone	S62.0
  Fracture of scapula	S42.1
  Fracture of shaft of humerus	S42.3
  Fracture of shaft of radius	S52.3
  Fracture of shoulder	S42.9
  Fracture of sternum	S22.2
  Fracture of talus	S92.1
  Fracture of tarsal bone (except calcaneous and talus)	S92.2
  Fracture of thoracic vertebra	S22.0
  Fracture of tibia	S82.2
  Fracture of toe	S92.5
  Fracture of tooth	S02.5
  Fracture of ulna	S52.2
  Fracture of upper arm	S42.3
  Fracture of upper end of radius	S52.1
  Fracture of upper end of tibia	S82.1
  Fracture of vault of skull	S02.0
  Fracture of zygoma	S02.4
  Fracture orbit floor	S02.8
  Fracture parasymphysis of mandible	S02.6
  Fracture rib	S22.3
  Fracture ribs	S22.4
  Fracture shaft of femur	S72.3
  Fracture zygoma	S02.4
  Fractured tooth	S02.5
  Framboesia (tropica)	A66.9
  Frostbite	T35.7
  Frostbite with tissue necrosis	T34.9
  Frozen shoulder	M75.0
  Fundus gastritis	K29.7
  Fungal infection of the nails	B35.1
  Fungemia	B49
  Furuncle at abdominal wall	L02.2
  Furuncle at ankle	L02.4
  Furuncle at arm	L02.4
  Furuncle at back	L02.2
  Furuncle at breast	N61
  Furuncle at buttock	L02.3
  Furuncle at chest wall	L02.2
  Furuncle at ear	H60.0
  Furuncle at elbow	L02.4
  Furuncle at eyelid	H00.0
  Furuncle at face	L02.0
  Furuncle at finger	L02.4
  Furuncle at foot	L02.4
  Furuncle at forearm	L02.4
  Furuncle at hand	L02.4
  Furuncle at hip	L02.4
  Furuncle at knee	L02.4
  Furuncle at leg	L02.4
  Furuncle at neck	L02.1
  Furuncle at nose	J34.0
  Furuncle at scalp	L02.8
  Furuncle at shoulder	L02.4
  Furuncle at thigh	L02.4
  Furuncle at toe	L02.4
  Furuncle at wrist	L02.4
  Furuncle eyelid	H00.0
  Furuncle of nose	J34.0
  Furunculosis	L02.9
  Furunculosis at abdominal wall	L02.2
  Furunculosis at ankle	L02.4
  Furunculosis at arm	L02.4
  Furunculosis at back	L02.2
  Furunculosis at breast	N61
  Furunculosis at buttock	L02.3
  Furunculosis at chest wall	L02.2
  Furunculosis at ear	H60.0
  Furunculosis at elbow	L02.4
  Furunculosis at eyelid	H00.0
  Furunculosis at face	L02.0
  Furunculosis at finger	L02.4
  Furunculosis at foot	L02.4
  Furunculosis at forearm	L02.4
  Furunculosis at hand	L02.4
  Furunculosis at hip	L02.4
  Furunculosis at knee	L02.4
  Furunculosis at leg	L02.4
  Furunculosis at neck	L02.1
  Furunculosis at nose	J34.0
  Furunculosis at scalp	L02.8
  Furunculosis at shoulder	L02.4
  Furunculosis at thigh	L02.4
  Furunculosis at toe	L02.4
  Furunculosis at wrist	L02.4
  GAD - generalized anxiety disorder	F41.1
  Galactocele	N64.8
  Galactophoritis puerperal	na
  Galactorrhea	N64.3
  Gall stone cholecystitis	K80.1
  Gall stone panceratitis	K85.1
  Gall stones	K80.2
  Gallbladder polyp	K82.8
  Gallbladder stones	K80.2
  Gallstone	K80.2
  Gallstone pancreatitis	K85.1
  Gallstones	K80.2
  Gambling	Z72.6
  Ganglion	M67.4
  Gangrene	R02
  Gangrene skin	R02
  Gas gangrene	A48.0
  Gastric flu	A09.9
  Gastric ulcer bleeding	K25.4
  Gastric ulcer perforatate	K25.5
  Gastric varices bleeding	I86.4
  Gastritis	K29.7
  Gastroduodenitis	K29.9
  Gastroenteritis	A09.9
  Gastroesophageal reflux disease	K21.9
  Gastrointestinal haemorrhage	K92.2
  Gastrointestinal infected	A09.9
  Gastrointestinal tract haemorrhage	K92.2
  Gastrojejunal ulcer	K28.9
  Gastrojejunitis	A09.9
  Gastro-oesophageal reflux disease -GERD	K21.9
  Gastroschisis	na
  Gastrostomy status	Z93.1
  GDM - gestational diabetes mellitus	na
  GE - gastroenteritis	A09.9
  Gender identity disorder	F64.9
  General eye examination	Z01.0
  General gynecologic examination	Z01.4
  General medical examination	Z00.0
  Generalised anxiety disorder	F41.1
  Generalised cancer	C79.9
  Generalised malignancy	C79.9
  Generalized anxiety disorder	F41.1
  Generalized cancer	C79.9
  Generalized malignancy	C79.9
  Generalized pain	R52.9
  Genital chancre	A51.0
  Genital granuloma inguinale	A58
  Genital syphilis	A51.0
  Genital syphilitic	A51.0
  Genital syphilitic chancre	A51.0
  Genital warts of penis	A63.0
  Genital warts of vulva	A63.0
  GERD ╚├Â Gastroesophageal reflux disease	K21.9
  German measles	B06.9
  Gestational diabetes mellitus	na
  Gestational hypertension	na
  Gestational lymphangitis of breast	na
  Gestational oedema	na
  GI - gastrointestinal bleeding	K92.2
  GI - gastrointestinal haemorrhage	K92.2
  GI- gastrointestinal bleed	K92.2
  Giant adenofibroma of breast	D24
  Giantism	E22.0
  Giardiasis	A07.1
  Giddiness	R42
  Gigantism	E22.0
  Gingivitis	K05.1
  Gingivoglossitis	K14.0
  Gingivostomatitis	K05.1
  Gl.Bartholin abscess	N75.1
  Glanders	A24.0
  Glaucoma	H40.9
  Glioblastoma multiforme	C71.9
  Glomerulonephritis	N05.9
  Glossitis	K14.0
  Glossodynia	K14.6
  Glossopathy	K14.9
  Glottitis	K14.0
  Glucose 6 phosphate dehydrogenase deficiency	D55.0
  Gluteal abscess	L03.3
  Glycosuria	R81
  Gnathostomasis	B83.1
  Goiter	E04.9
  Goiter exophthalmos (etiology)	E05.0
  Goiter hyperthyroidism, multinodular	E05.2
  Goiter hyperthyroidism, uninodular	E05.1
  Goiter nontoxic	E04.9
  Goiter thyrotoxicosis, multinodular	E05.2
  Goiter thyrotoxicosis, uninodular	E05.1
  Goiter with hyperthyroidism	E05.0
  Goiter, unspecified	E04.9
  Goitre	E04.9
  Goitre (nontoxic) congenital NOS	E03.0
  Goitre, nontoxic diffuse (colloid)	E04.0
  Goitre, nontoxic simple	E04.0
  Gonarthrosis	M17.9
  Goniosynechiae	H21.5
  Gonococcal conjunctivitis	A54.3
  Gonorrhea	A54.9
  Gonorrhea contact	Z20.2
  Gonorrhoea	A54.9
  Gout	M10.0
  Gout arthritis	M10.0
  Gouty arthritis	M10.0
  Grand multiparity	Z64.1
  Granuloma inguinale	A58
  Granuloma inguinale tropicum	A58
  Granuloma pudendi tropicum	A58
  Granulomatous disorder of skin	L92.9
  Graves	E05.0
  Graves disease	E05.0
  Graves' disease	E05.0
  Graves' disease with exophthalmos	E05.0
  Groin contusion	S30.1
  Groin pain	R10.3
  GS - gallstone	K80.2
  Guillain barre's syndrome	G61.0
  Guinea worm infection	B72
  Gut obstruction	K56.6
  Gynaecological examination	Z01.4
  Gynaecomastia	N62
  Gynecological examination	Z01.4
  Gynecomazia	N62
  Habit and impulse disorder	F63.9
  Habitual aborter	N96
  Haematemesis	K92.0
  Haematoma of obstetric wound	na
  Haematuria	R31
  Haemoglobin E thalassaemia	D56.9
  Haemoglobin E trait	D58.2
  Haemoglobin H disease	D58.2
  Haemophilia classical	D66
  Haemophilia	D66
  Haemoptysis	R04.2
  Haemorrhage	R58
  Haemorrhage after delivery of fetus or infant	O72.1
  Haemorrhage from throat	R04.1
  Haemorrhoids in pregnancy	O22.4
  Hair alopecia	L65.9
  Halitosis	R19.6
  Hallucination	R44.3
  Hallux rigidus	M20.2
  Hallux valgus	M20.1
  Hamartoma	Q85.9
  Hand - burn	T23.0
  Hand absent, with absent wrist	Z89.1
  Hand deformity	M21.9
  Hand foot mouth disease	B08.4
  Hand pain	M79.6
  Hand paralysis	G83.2
  Hand traumatic amputation	S68.4
  Hand, foot and mouth disease	B08.4
  Head - burn	T20.0
  Head cold	J00
  Head injury	S09.9
  Head lice	B85.0
  Headache	R51
  Head-louse infestation	B85.0
  Health checkup	Z00.0
  Health check-up, infant or child	Z00.1
  Health HBV carrier	Z22.8
  Healthy check-up	Z00.0
  Hearing examination	Z01.1
  Hearing impairment	H91.9
  Hearing test	Z01.1
  Heart block	I45.9
  Heart dilatation	I51.7
  Heart disease	I51.9
  Heart injury	S26.9
  Heart failure	I50.9
  Heart palpitations	R00.2
  Heart rate fast	R00.0
  Heart rate slow	R00.1
  Heartburn	R12
  Heartburn symptom	R12
  Heat collapse	T67.1
  Heat exhaustion	T67.5
  Heat stroke	T67.0
  Heat syncope	T67.1
  Heatstroke	T67.0
  Heel ulcer	L97
  Helminthiases	B83.9
  Hemarthrosis	M25.0
  Hematemesis	K92.0
  Hematobilia	K83.8
  Hematoma episiotomy	O90.2
  Hematoma of anterior abdomen	S30.1
  Hematoma of anterior chest	S20.3
  Hematoma of auricle	S00.4
  Hematoma of eyelid	S00.1
  Hematoma of neck	S10.9
  Hematoma of pinna	S00.4
  Hematoma of scalp	S00.0
  Hematoma postoperative	T81.0
  Hematoma vagina	N98.8
  Hematometra	N85.7
  Hematosalpinx	N83.6
  Hematospermia	N50.1
  Hematuria	R31
  Hemianalgesia	R20.0
  Hemianesthesia	R20.0
  Hemianopia	H53.4
  Hemiatrophy	R68.8
  Hemiballism	G25.5
  Hemihypalgesia	R20.1
  Hemihypesthesia	R20.1
  Hemiparalysis	G81.9
  Hemiparesis	G81.9
  Hemiparesthesia	R20.2
  Hemiparkinsonism	G20
  Hemiplegia	G81.9
  Hemochromatosis	E83.1
  Hemoglobin E	D58.2
  Hemoglobin E trait	D58.2
  Hemoglobinemia	D59.9
  Hemoglobinopathy	D58.2
  Hemoglobinuria	R82.3
  Hemolysis jaundice	D59.9
  Hemolytic jaundice	D59.9
  Hemopericardium	I31.2
  Hemoperitoneum	K66.1
  Hemophilia	D66
  Hemophilia A	D66
  Hemophilia B	D67
  Hemophilus influenzae pneumonia	J14
  Hemopneumothorax	J94.2
  Hemoptysis	R04.2
  Hemorrhage anemia	D62
  Hemorrhage anemia, acute	D62
  Hemorrhage from pharynx	R04.1
  Hemorrhage from the ear	H92.2
  Hemorrhage in early pregnancy	na
  Hemorrhage in pregnancy	na
  Hemorrhage of anus	K62.5
  Hemorrhage of newborn	na
  Hemorrhage of pregnancy	na
  Hemorrhage postprocedure	T81.0
  Hemorrhagic anemia	D62
  Hemorrhagic cystitis	N30.9
  Hemorrhagic dengue	A97.0
  Hemorrhagic feverThailand	A97.0
  Hemorrhagic gastritis	K29.0
  Hemorrhoids	K64.9
  Hemorrhoids complicating pregnancy	na
  Hemorrhoids, external	K64.8
  Hemorrhoids, internal	K64.9
  Hemosalpinx	N83.6
  Hemosiderosis	E83.1
  Hemothorax	J94.2
  Hepatic encephalopaty	K72.9
  Hepatitis	K75.9
  Hepatitis A	B15.9
  Hepatitis B	B16.9
  Hepatitis B cirrhosis	K74.6
  Hepatitis B viral	B16.9
  Hepatitis carrier of hepatitis virus	Z22.8
  Hepatitis virus, chronic, type B	B18.1
  Hepatoblastoma	C22.2
  Hepatocarcinoma	C22.0
  Hepatocellular cacinoma	C22.0
  Hepatocholangiocarcinoma	C22.0
  Hepatocholangitis	K75.8
  Hepatoma	C22.0
  Hepatomegaly	R16.0
  Hepatosplenomegaly	R16.2
  Hereditary ataxia	G11.9
  Hereditary hemolytic anemia	D58.9
  Hereditary hemophilia	D66
  Hereditary myopathy	G71.9
  Hereditary nephropathy	N07.9
  Hernia	K46.9
  Herniated nucleus pulposus	M51.2
  Herpangina	B08.5
  Herpes meningitis	B00.3
  Herpes simplex infection of external genitalia	A60.0
  Herpes simplex infection of lip	B00.1
  Herpes simplex labialis	B00.1
  Herpes zoster	B02.9
  Herpes zoster of skin and mucous membranes	B02.9
  Herpes zoster, unspecified	B02.9
  Herpetic gingivostomatitis	B00.2
  HI - hearing impairment	H91.9
  Hiccough	R06.6
  Hiccup	R06.6
  Hidradenitis	L73.2
  High blood sugar	R73.9
  High-risk sexual behaviour	Z72.5
  Hilar cholangiocarcinoma	C22.1
  Hip burn	T24.0
  Hip crushed	S77.0
  Hip deformity	M21.9
  Hip dislocation	S73.0
  Hip injury	S79.9
  Hirschsprung 's desease	Q43.1
  Hirsutism	L68.0
  Hirudiniasis	B88.3
  Hirudiniasis - leech infestation	B88.3
  Histiocytosis	D76.3
  Histoplasmosis	B39.9
  Hiv disease asymptomatic status	Z21
  HIV positive NOS	Z21
  HIV test positive	R75
  HIV test, positive, asymptomatic	Z21
  Hives	L50.9
  Hld - hyperlipidemia	E78.5
  Hodgkin's disease	C81.9
  Hodgkin's lymphoma	C81.9
  Homelessness	Z59.0
  Homesick	F43.2
  Homesickness	F43.2
  Hookworm	B76.9
  Hordeolum	H00.0
  Hordeolum externum	H00.0
  Hordeolum externum lower eyelid	H00.0
  Hordeolum externum upper eyelid	H00.0
  Hordeolum internum	H00.0
  Hordeolum internum lower eyelid	H00.0
  Hordeolum internum upper eyelid	H00.0
  Horseshoe fistula in ano	K60.3
  Hospital acquired pneumonia	J18.9
  Hostility	R45.5
  Housing lack	Z59.0
  HPTH - hyperparathyroidism	E21.3
  HT - Hypertension	I10
  HTN - Hypertension	I10
  Human immunodeficiency virus [HIV] contact	Z20.6
  Human immunodeficiency virus disease	B24
  Humpback	M40.2
  Hunchback	M40.2
  Huntington disease	G10
  HV - hyperventilation	R06.4
  Hydatidiform mole	O01.9
  Hydramnios	na
  Hydrarthrosis	M25.4
  Hydrocele	N43.3
  Hydrocephalus	G91.9
  Hydroencephalocele	Q01.9
  Hydroencephalomeningocele	Q01.9
  Hydromeningocele	Q05.9
  Hydrometra	N85.8
  Hydrometrocolpos	N89.8
  Hydromicrocephaly	Q02
  Hydromyelia	Q06.4
  Hydromyelocele	Q05.4
  Hydronephrosis	N13.3
  Hydropericardium	I31.9
  Hydroperitoneum	R18
  Hydrophobia	A82.9
  Hydrophthalmos	Q15.0
  Hydropneumothorax	J94.8
  Hydrosalpinx	N70.1
  Hydrothorax	J94.8
  Hydroureter	N13.4
  Hydroureteronephrosis	N13.3
  Hydrourethra	N36.8
  Hygroma	D18.1
  Hymenolepis	B71.0
  Hypalgesia	R20.8
  Hyperacidity	K31.8
  Hyperadrenalism	E27.5
  Hyperadrenocorticism	E24.9
  Hyperaldosteronism	E26.9
  Hyperalgesia	R20.8
  Hyperalimentation	R63.2
  Hyperazotemia	N19
  Hyperbetalipoproteinemia	E78.0
  Hyperbilirubinemia	E80.6
  Hypercalcemia	E83.5
  Hypercalciuria	E83.5
  Hypercapnia	R06.8
  Hyperchloremia	E87.8
  Hyperchlorhydria	K31.8
  Hypercholesterolaemia	E78.0
  Hypercholesterolemia	E78.0
  Hyperemesis gravidarum	na
  Hyperemia	R68.8
  Hyperesthesia	R20.3
  Hyperglycemia	R73.9
  Hyperhidrosis	R61.9
  Hyperinsulinism	E16.1
  Hyperkalemia	E87.5
  Hyperkinesia	F90.9
  Hyperlipemia	E78.5
  Hyperlipidaemia	E78.5
  Hyperlipidemia	E78.5
  Hyperlipoproteinemia	E78.5
  Hypermagnesemia	E83.4
  Hypermaturity	na
  Hypermenorrhea	N92.0
  Hypermetropia	H52.0
  Hypernasality	R49.2
  Hypernatremia	E87.0
  Hyperopia	H52.0
  Hyperosmia	R43.1
  Hyperosmolality	E87.0
  Hyperostosis	M85.8
  Hyperparathyroid	E21.3
  Hyperparathyroidism	E21.3
  Hyperperistalsis	R19.2
  Hyperphosphatemia	E83.3
  Hyperpigmentation	L81.8
  Hyperpituitarism	E22.9
  Hyperplasia of prostate	N40
  Hyperpnea	R06.4
  Hyperpotassemia	E78.5
  Hyperprolactinemia	E22.1
  Hyperproteinemia	E88.0
  Hyperprothrombinemia	D68.4
  Hyperpyrexia	R50.9
  Hyperreactive airway	J68.3
  Hypersensitivity	T78.4
  Hypersensitivity pneumonitis	J67.9
  Hypersomnia	G47.1
  Hypersplenia	D73.1
  Hypertelorism	Q75.2
  Hypertension	I10
  Hypertension emergency	I10
  Hypertension gravida	na
  Hypertension induced by pregnancy	na
  Hypertension screen	Z13.6
  Hypertension screening	Z13.6
  Hypertensive disorder	I10
  Hypertensive encephalopathy	I67.4
  Hypertensive heart and renal disease	I13.9
  Hypertensive heart diseae	I11.9
  Hypertensive renal diseae	I12.9
  Hypertensive urgency	I10
  Hyperthermia	R50.9
  Hyperthyroid	E05.9
  Hyperthyroid goiter	E05.0
  Hyperthyroidic goiter	E05.0
  Hyperthyroidism	E05.9
  Hyperthyroidism goiter	E05.0
  Hyperthyroidism goiter, adenomatous	E05.2
  Hyperthyroidism goiter, nodular	E05.2
  Hyperthyroidism thyroid nodule	E05.1
  Hypertrichosis	L68.9
  Hypertriglyceridemia	E78.1
  Hypertrophic disorder of skin	L91.9
  Hypertrophic scar	L91.0
  Hypertrophic surgical scar	L91.0
  Hypertrophy of tonsils	J35.1
  Hypertrophy tonsils	J35.1
  Hypertropia	H50.2
  Hyperuricemia	E79.0
  Hyperventilation	R06.4
  Hypervitaminosis	E67.8
  Hypesthesia	R20.3
  Hyphaema	H21.0
  Hyphema, unspecified eye	H21.0
  Hyphemia	H21.0
  Hypoacidity	K31.8
  Hypoadrenalism	E27.4
  Hypoadrenocorticism	E27.5
  Hypoalbuminemia	E88.0
  Hypoaldosteronism	E27.4
  Hypobarism	T70.2
  Hypobaropathy	T70.2
  Hypocalcemia	E83.5
  Hypochloremia	E87.8
  Hypochlorhydria	K31.8
  Hypochondria	F45.2
  Hypochondriacal disorder	F45.2
  Hypochondriacal disorders	F45.2
  Hypochondriasis	F45.2
  Hypodontia	K00.0
  Hypoesthesia	R20.1
  Hypoglossia	Q38.3
  Hypoglycemia	E16.2
  Hypoglycemia drug induce	E16.0
  Hypogonadism, female	E28.3
  Hypogonadism, male	E29.1
  Hypohidrosis	L74.4
  Hypoinsulinemia	E89.1
  Hypokalemia	E87.6
  Hypolipoproteinemia	E78.6
  Hypomagnesemia	E83.4
  Hypomania	F30.0
  Hypomenorrhea	N91.5
  Hypometabolism	R63.8
  Hyponatremia	E87.1
  Hypoparathyroidism	E20.9
  Hypoparathyroidism, unspecified	E20.9
  Hypophosphatemia	E83.3
  Hypopituitarism	E23.0
  Hypopotassemia	E87.6
  Hypoproteinemia	E77.8
  Hypoprothrombinemia	D68.2
  Hypopyrexia	R68.0
  Hyporeflexia	R29.2
  Hyposomnia	G47.0
  Hypospadias	Q54.9
  Hypotension	I95.9
  Hypotension due to drugs	I95.2
  Hypothermia	T68
  Hypothermia due to exposure	T68
  Hypothyroid	E03.9
  Hypotrichosis	L65.9
  Hypoventilation	R06.8
  Hypovitaminosis	E56.9
  Hypovolaemia	E86
  Hypovolemic	E86
  Hypovolumic hyponatremia	E87.1
  Hypoxia	R09.0
  Hysteria	F44.9
  Iatrogenic hypoglycemia	E16.0
  Ichthyosis	Q80.9
  ICP - infantile cerebral palsy	G80.9
  IDDM	E10.9
  IDDM - insulin-dependent diabetes mellitus	E10.9
  Idiopathic diabetes (mellitus)	E10.9
  Idiopathic thrombocytopenic purpura	D69.3
  Idiopathic Type 1 diabetes mellitus	E10.9
  IFG - impaired fasting glucose	R73.0
  IGT - impaired glucose tolerance test	R73.0
  Ileitis	A09.9
  Ileocolitis	A09.9
  Ileostomy status	Z93.2
  Ileus	K56.7
  Illness	R69
  Immersion	T75.1
  Immune disease	D89.9
  Immobility	R26.3
  Immunization not carried out	Z28.9
  Immunodeficiency	D84.9
  Impacted cerumen	H61.2
  Impacted multiple common bile duct stones	K80.5
  Impacted teeth	K01.1
  Impacted tooth	K01.1
  Impacted wax	H61.2
  Impaired fasting glucose	R73.0
  Impaired fasting glycaemia (IFG)	R73.0
  Impaired glucose (carbohydrate) tolerance (IGT)	R73.0
  Impaired glucose tolerance	R73.0
  Impaired hearing	H91.9
  Impetigo	L01.0
  Impingement massive rotator cuff tear	M75.1
  Impingement shoulder syndrome	M75.4
  Impingement syndrome	M75.4
  Impingement syndrome shoulder	M75.4
  Impotence	F52.2
  Imprisonment and other incarceration	Z65.1
  Improper care	T74.0
  Inadequate drinking-water supply	Z58.6
  Inadequate income	Z59.6
  Inadequate material resources	Z59.6
  Inadequate social skills	Z73.4
  Inappropriate diet and eating habits	Z72.4
  Incarcerated indirect inquinal hernia	K40.3
  Incisional hernia	K43.0
  Incomplete abortion	O06.4
  Increased blood pressure, reading, no diagnosis of hypertension	R03.0
  Increased heart rate	R00.0
  Indigestion	K30
  Indirect inguinal hernia	K40.9
  Induced delusional disorder	F24
  Induced nephropathy	N28.9
  Infant diarrhea	A09.9
  Infant liveborn	na
  Infant liveborn, born, in hospital	na
  Infant liveborn, born, outside hospital	na
  Infant regurgitation	R11
  Infantile autism	F84.0
  Infantile cerebral palsy	G80.9
  Infantile cerebral palsy, unspecified	G80.9
  Infantile diarrhea	A09.9
  Infantile sudden death	R95
  Infantile tuberculosis	A16.9
  Infantile tuberculous	A16.9
  Infected bed sore	L89.9
  Infected bedsore	L89.9
  Infected bronchiectasis	J47
  Infected caesarean section wound following delivery	na
  Infected chalazion	H00.0
  Infected dialysis catheter	T82.7
  Infected epidermal inclusion cyst	L72.0
  Infected epidermoid cyst	L72.0
  Infected ingrowing toenail	L03.0
  Infected perineal repair following delivery	na
  Infected pseudo pancreatic cyst	K86.3
  Infected sebaceous cyst	L72.1
  Infected wound	T79.3
  Infection Bartholin's gland	N75.8
  Infection bladder	N30.9
  Infection colitis	A09.0
  Infection gastroenteritis	A09.0
  Infection of bladder	N30.9
  Infection of external ear	H60.8
  Infection of kidney	N15.9
  Infection of nipple associated with childbirth	na
  Infection of obstetric surgical wound	na
  Infection perineal repair	na
  Infection puerperal, nipple	na
  Infection tuberculous, without clinical manifestations	A16.9
  Infections due to Dengue virus	A97.9
  Infections due to helminths	B83.9
  Infections of breast associated with childbirth	na
  Infectious catarrh	J00
  Infectious colitis	A09.0
  Infectious conjunctivitis	H10.9
  Infectious cystitis	N30.9
  Infectious diarrhea	A09.0
  Infectious diarrhoea	A09.0
  Infectious diarrhoeal disease	A09.0
  Infectious disease of digestive tract	A09.0
  Infectious disease of intestine	A09.0
  Infectious endocarditis	I33.0
  Infectious enteritis	A09.0
  Infectious enteritis, unspecified	A09.0
  Infectious enterocolitis	A09.0
  Infectious gastroenteritis nos	A09.0
  Infectious mononucleosis	B27.9
  Infectious pneumonia	J18.9
  Infectious thyroiditis	E06.0
  Infective colitis	A09.0
  Infective cystitis	N30.9
  Infective diarrhea	A09.0
  Infective diarrhoea	A09.0
  Infective endocarditis	I38
  Infective nasopharyngitis	J00
  Infective otitis externa	H60.8
  Inferior rhagmatogenous retinal detachment	H33.0
  Inferior wall st elevate myocardial infarction	I21.2
  Infertility, female	N97.9
  Infertility, male	N46
  Infestation by crab lice	B85.3
  Infestation by Hirudo	B88.3
  Infestation by Pediculus	B85.2
  Infestation by Pediculus capitis	B85.0
  Infestation by Pediculus corporis	B85.1
  Infestation by Phthirus	B85.3
  Infestation by Phthirus pubis	B85.3
  Infestation by Sarcoptes scabiei var. hominis	B86
  Inflammation of conjunctiva	H10.9
  Inflammation of tongue	K14.0
  Inflammatory disorder of male genital organ	N49.9
  Influenza	J11.1
  Influenza A	J11.1
  Influenza A infection	J11.1
  Influenza A infection pneumonia	J11.0
  Influenza b infection	J11.1
  Influenza vaccination	Z25.1
  Influenza, unspecified	J11.1
  Infrarenal abdominal aortic aneurysm	I71.4
  Ingrowing nail	L60.0
  Ingrowing toenail	L60.0
  Inguinal hernia	K40.9
  Inguinal hernia (unilateral) NOS	K40.9
  Inguinal region contusion	S30.1
  Initial prescription of contraceptives	Z30.0
  Injuries to scalp due to birth trauma	na
  Injury eyeball, penetrating	S05.6
  Injury intraocular	S05.6
  Injury of abdominal aorta	S35.0
  Injury of axillary artery	S45.0
  Injury of blood vessel at abdomen	S35.9
  Injury of blood vessel at foot level	S95.9
  Injury of blood vessel at forearm level	S55.9
  Injury of blood vessel at hip and thigh level	S75.9
  Injury of blood vessel at lower leg level	S85.9
  Injury of blood vessel at neck level	S15.9
  Injury of blood vessel at upper arm level	S45.9
  Injury of blood vessel at wrist and hand level	S65.9
  Injury of blood vessel of thorax	S25.9
  Injury of brachial artery	S45.1
  Injury of carotid artery	S15.0
  Injury of eye	S05.9
  Injury of intra-abdominl organ	S36.9
  Injury of intrathoracic organ	S27.9
  Injury of muscle and tendon at foot level	S96.9
  Injury of muscle and tendon at forearm level	S56.8
  Injury of muscle and tendon at hip and thigh level	S76.4
  Injury of muscle and tendon at lower leg level	S86.9
  Injury of muscle and tendon at neck level	S16
  Injury of muscle and tendon at upper arm level	S46.9
  Injury of muscle and tendon at wrist and hand level	S66.9
  Injury of muscle and tendon of the rotator cuff of shoulder	S46.0
  Injury of nerve at foot level	S94.9
  Injury of nerve at forearm level	S54.9
  Injury of nerve at hip and thigh level	S74.9
  Injury of nerve at lower back	S34.8
  Injury of nerve at lower leg level	S84.9
  Injury of nerve at upper arm level	S44.9
  Injury of nerve at wrist and hand level	S64.9
  Injury of nerve of thorax	S24.6
  Injury of ovary	S37.4
  Injury of pelvic organ	S37.9
  Injury of stomach	S36.3
  Injury of ureter	S37.1
  Injury of uterus	S37.6
  Injury superficial, nose	S00.3
  Injury, cornea, Abrasion at	S05.0
  Insertion intrauterine contraceptive device	Z30.1
  Insertion of contraceptive device	Z30.1
  Insomnia	G47.0
  Insufficiency welfare support	Z59.7
  Insufficient social insurance	Z59.7
  Insufficient social insurance and welfare support	Z59.7
  Insufficient welfare support	Z59.7
  Insulin dependency diabetes mellitus	E10.9
  Insulin dependency diabetic mellitus	E10.9
  Insulin dependent diabetic	E10.9
  Insulin dependent diabetic mellitus	E10.9
  Insulin resistant diabetes (mellitus)	E11.9
  Insulin-dependent diabetes mellitus	E10.9
  Insurance social, inadequate	Z59.7
  Internal derangement of knee	M23.9
  Internal hemorrhoids	K64.9
  Internal hordeolum	H00.0
  Internal sty	H00.0
  Intersphinteric abscess	K61.4
  Intertrochanteric fracture	S72.1
  Intestinal helminthiaasis	B82.0
  Intestinal infection, exposure	Z20.0
  Intracerebral hemorrhage	I61.9
  Intracranial abscess	G06.0
  Intracranial hemorrhage	I62.9
  Intracranial injury	S06.9
  Intrahepatic cholangiocarcinoma	C22.1
  Intramural and subserous myoma	D25.1
  Intramural myoma of uterus	D25.1
  Intramural myoma uteri	D25.1
  Intraocular foreign body	S05.5
  Intraocular lens dislocation	H27.1
  Intraocular lens inferior dislocation	H27.1
  Intraocular lens subluxation	H27.1
  Intrapartum haemorrhage	na
  Intrauterine growth restriction	na
  Intrauterine growth retardation	na
  Intraventricular hemorrhage	I61.5
  Intussusception	K56.1
  Invasive ductal cell carcinoma breast	C50.9
  Inversion nipple, gestational	na
  Inversion nipple, puerperal, postpartum	na
  Iodine deficiency goiter	E01.2
  Iodine-deficiency goiter (endemic)	E01.2
  Iridochoroiditis	H44.1
  Iridocyclitis	H20.9
  Iris prolape	S05.2
  Iritis	H20.9
  Iron deficiency anemia	D50.9
  Iron deficiency anemia due to chronic blood loss	D50.0
  Irregular bleeding	N92.6
  Irregular menses	N92.6
  Irregular menstrual bleeding	N92.6
  Irregular menstruation	N92.6
  Irregular periods	N92.6
  Irritability	R45.4
  Irritable bowel syndrome	K58.9
  Irritant contact dermatitis	L24.9
  Ischaemic heart disease	I25.9
  Ischemic enteritis	K55.9
  Ischemic stroke	I63.9
  Ischiorectal abscess	K61.3
  Isolated cleft lip, bilateral	Q36.0
  Isolated proteinuria	N06.9
  Isolation	Z29.0
  Issue of medical certificate	Z02.7
  Issue of repeat prescription, contraceptive (pill)	Z30.4
  Itching of skin	L29.9
  IUD insertion	Z30.1
  Jaundice	R17
  Jaw dislocation	S03.0
  Jejunitis	A09.9
  Jellyfish sting	T63.6
  Joint derangement	M24.9
  Joint disorder	M25.9
  Joint stiffness	M25.6
  Junctional bradycardia	R00.1
  Juvenile ankylosing spondylitis	M08.1
  Juvenile arthritis	M08.9
  Juvenile onset diabetes (mellitus)	E10.9
  Juvenile onset diabetic	E10.9
  Juvenile onset diabetic mellitus	E10.9
  Juvenile onset of diabetes	E10.9
  Juvenile rheumatoid arthritis	M08.0
  Juvenile-onset diabetes	E10.9
  Juvenile osteochondrosis	M92.9
  Juvenile osteochondrosis of hip and pelvis	M91.9
  Kaposi╚├═s sarcoma	C46.9
  Kawasaki's disease	M30.3
  Keloid	L91.0
  Keloidal surgical scar	L91.0
  Keratitis	H16.9
  Keratoconjunctivitis	H16.2
  Keratoma	L57.0
  Keratoscleritis tuberculous	A18.5
  Keratosis	L57.0
  Kerion	B35.0
  Kernicterus	na
  Ketoacidosis	E87.2
  Ketonuria	R82.4
  Ketosis	E88.8
  Ketosis-resistant diabetes mellitus	E11.9
  Kidney calculi impaction	N20.0
  Kidney donor for transplantation	Z52.4
  Kleptomania	F63.2
  Klinefelter╚├═s syndrome	Q98.4
  Knee contusion	S80.0
  Knee crushed	S87.0
  Knee dislocation	S83.1
  Koilonychia	L60.3
  Kuru	A81.8
  Kwashiorkor	E40
  Kyphoscoliosis	M41.9
  Kyphosis	M40.2
  LA - lymphadenopathy	R59.9
  Laboratory evidence of HIV	R75
  Laboratory evidence of human immunodeficiency virus	R75
  Laboratory examination	Z01.7
  Laboratory hiv	R75
  Laboratory test	Z01.7
  Labyrinthitis	H83.0
  Laceration at ankle	S91.0
  Laceration at arm (upper)	S41.1
  Laceration at axilla	S41.8
  Laceration at back, lower	S31.0
  Laceration at back, upper	S21.2
  Laceration at breast	S21.0
  Laceration at brow	S01.1
  Laceration at buttock	S31.0
  Laceration at cheek	S01.4
  Laceration at chest wall	S21.1
  Laceration at chin	S01.8
  Laceration at ear	S01.3
  Laceration at elbow	S51.0
  Laceration at eyelid	S01.1
  Laceration at face	S01.8
  Laceration at forearm	S51.9
  Laceration at finger	S61.0
  Laceration at flank	S31.1
  Laceration at foot	S91.3
  Laceration at forehead	S01.8
  Laceration at groin	S31.1
  Laceration at hand	S61.8
  Laceration at head	S01.8
  Laceration at heal	S91.3
  Laceration at hip	S71.0
  Laceration at knee	S81.0
  Laceration at lip	S01.5
  Laceration at lower leg	S81.8
  Laceration at mouth	S01.5
  Laceration at neck	S11.8
  Laceration at nose	S01.2
  Laceration at penis	S31.2
  Laceration at perineum	S31.5
  Laceration at scalp	S01.0
  Laceration at scrotum	S31.3
  Laceration at shoulder	S41.0
  Laceration at thigh	S71.1
  Laceration at thumb	S61.0
  Laceration at toe	S91.1
  Laceration at vagina	S31.4
  Laceration at vulva	S31.4
  Laceration at wrist	S61.8
  Laceration of eye	S05.6
  Laceration vulva, complicating delivery	na
  Lack of adequate food	Z59.4
  Lack of appetite	R63.0
  Lack of heating	Z59.1
  Lack of housing	Z59.0
  Lack of material resources	Z59.6
  Lack of physical exercise	Z72.3
  Lactating mother care	na
  Lactation mastitis	na
  Lactose intolerance	E73.9
  Lacunar infarction	I63.8
  Lagophthalmos	H02.2
  Lambliasis	A07.1
  Language disorder	F80.9
  Large cell non-hodgkin's lymphoma	C83.3
  Laryngitis	J04.0
  Laryngitis (acute)	J04.0
  Laryngocele	Q31.3
  Laryngomalacia	Q31.5
  Laryngopharyngitis	J06.0
  Laryngostenosis	J38.6
  Laryngotracheitis	J04.2
  Laryngotracheobronchitis	J40
  Larynx inflammation	J04.0
  Late neonatal sepsis	na
  Late onset neonatal sepsis	na
  Late syphilis	A52.9
  Latent tuberculosis	Z22.8
  Lateral epicondylitis	M77.1
  Lateral medullary syndrome	I66.3
  Laxative habit	F55
  LE - Lupus erythematosus	L93.0
  Learning disability	F81.9
  Leech in rectum	B88.3
  Leech infestation	B88.3
  Leech infestation, not otherwise specified	B88.3
  Leeches	B88.3
  Leg absence	Z89.6
  Leg deformity	M21.9
  Leg pain	M79.6
  Leg paralysis	G83.1
  Leg ulcer	L97
  Legionnaire╚├═s disease	A48.1
  Legs edema	R60.9
  Leishmaniasis	B55.9
  Lentigo	L81.4
  Leprosy	A30.9
  Leptomeningitis	G03.9
  Leptospirosis	A27.9
  Lethargy	R53
  Leukemia	C95.9
  Leukoencephalitis	G04.8
  Leukoencephalopathy	G93.4
  Leukopenia	D70
  Leukorrhea	N89.8
  Levocardia	Q24.1
  Levotransposition	Q20.5
  Lice body	B85.1
  Lice head	B85.0
  Lice pubic	B85.3
  Lichen planus	L43.9
  Light headed	R42
  Light-headedness	R42
  Lightning	T75.0
  Lip, benign neoplasm	D10.0
  Lipemia	E78.5
  Lipemic	E78.5
  Lipidemia	E78.5
  Lipoma at abdominal wall	D17.1
  Lipoma at ankle	D17.2
  Lipoma at arm	D17.2
  Lipoma at back	D17.1
  Lipoma at breast	D17.1
  Lipoma at buttock	D17.1
  Lipoma at chest wall	D17.1
  Lipoma at ear	D17.0
  Lipoma at elbow	D17.2
  Lipoma at eyelid	D17.0
  Lipoma at face	D17.0
  Lipoma at finger	D17.2
  Lipoma at foot	D17.2
  Lipoma at forearm	D17.2
  Lipoma at hand	D17.2
  Lipoma at hip	D17.2
  Lipoma at knee	D17.2
  Lipoma at leg	D17.2
  Lipoma at neck	D17.0
  Lipoma at nose	D17.0
  Lipoma at scalp	D17.0
  Lipoma at shoulder	D17.2
  Lipoma at thigh	D17.2
  Lipoma at toe	D17.2
  Lipoma at wrist	D17.2
  Lipoplethoric diabetes mellitus (in part)	E11.9
  Listeriosis	A32.9
  Liveborn infant	na
  Liveborn infant, twin	na
  Liver abscess	K75.0
  Liver chirrhosis	K74.6
  Liver disease	K76.9
  Living alone	Z60.2
  Lobar pneumonia	J18.1
  Localized adiposity	E65
  Localized adiposity, unspecified	E65
  Localized connective tissue disorder	L94.9
  Localized swelling, mass and lump of skin and subcutaneous tissue at abdominal wall	R22.2
  Localized swelling, mass and lump of skin and subcutaneous tissue at ankle	R22.4
  Localized swelling, mass and lump of skin and subcutaneous tissue at arm	R22.3
  Localized swelling, mass and lump of skin and subcutaneous tissue at back	R22.2
  Localized swelling, mass and lump of skin and subcutaneous tissue at breast	R22.2
  Localized swelling, mass and lump of skin and subcutaneous tissue at buttock	R22.2
  Localized swelling, mass and lump of skin and subcutaneous tissue at chest wall	R22.2
  Localized swelling, mass and lump of skin and subcutaneous tissue at ear	R22.0
  Localized swelling, mass and lump of skin and subcutaneous tissue at elbow	R22.3
  Localized swelling, mass and lump of skin and subcutaneous tissue at eyelid	R22.0
  Localized swelling, mass and lump of skin and subcutaneous tissue at face	R22.0
  Localized swelling, mass and lump of skin and subcutaneous tissue at finger	R22.3
  Localized swelling, mass and lump of skin and subcutaneous tissue at foot	R22.4
  Localized swelling, mass and lump of skin and subcutaneous tissue at forearm	R22.3
  Localized swelling, mass and lump of skin and subcutaneous tissue at hand	R22.3
  Localized swelling, mass and lump of skin and subcutaneous tissue at hip	R22.4
  Localized swelling, mass and lump of skin and subcutaneous tissue at knee	R22.4
  Localized swelling, mass and lump of skin and subcutaneous tissue at leg	R22.4
  Localized swelling, mass and lump of skin and subcutaneous tissue at neck	R22.1
  Localized swelling, mass and lump of skin and subcutaneous tissue at nose	R22.0
  Localized swelling, mass and lump of skin and subcutaneous tissue at scalp	R22.0
  Localized swelling, mass and lump of skin and subcutaneous tissue at shoulder	R22.3
  Localized swelling, mass and lump of skin and subcutaneous tissue at thigh	R22.4
  Localized swelling, mass and lump of skin and subcutaneous tissue at toe	R22.4
  Localized swelling, mass and lump of skin and subcutaneous tissue at wrist	R22.3
  Lockjaw	A35
  Long prepuce	N47
  Loose body in knee	M23.4
  Lordosis	M40.5
  Loss of appetite	R63.0
  Loss of fluid	E86
  Loss of hearing	H91.9
  Loss of memory	R41.3
  Loss of sensation	R20.0
  Loss of voice	R49.1
  Loss of weight	R63.4
  Louse infestation	B85.2
  Low back pain	M54.5
  Low blood pressure reading	R03.1
  Low forceps delivery	na
  Low income	Z59.6
  Low vision	H54.2
  Low vision, both eyes	H54.2
  Lower abdominal pain	R10.3
  Lower gastrointestinal bleeding	K92.2
  Lower leg injury	S89.9
  Lower limb burn	T24.0
  Lower limb fracture	T12
  Lower limb pain	M79.6
  Lower limb paralysis	G83.1
  Ludwig╚├═s angina	K12.2
  Lumbago	M54.5
  Lumbar spondylosis	M47.8
  Lump in breast	N63
  Lump or mass in breast	N63
  Lumpy breast	N63
  Lumpy breasts	N63
  Lung abscess	J85.2
  Lung cancer	C34.9
  Lung cavitation	A16.9
  Lung disease obstructive	J44.9
  Lung injury	S27.3
  Lung lesion	R91
  Lung malignant neoplasm	C34.9
  Lung mass	R91
  Lung obstruction, disease, chronic	J44.9
  Lupus erythematosus	L93.0
  Luxation of tooth	S03.2
  Lymphadenitis	I88.9
  Lymphadenitis breast, gestational	na
  Lymphadenopathy	R59.1
  Lymphadenosis	R59.1
  Lymphangiectasis	I89.0
  Lymphangioma	D18.1
  Lymphangitis	I89.1
  Lymphangitis of breast gestational or puerperal	na
  Lymphedema	I89.0
  Lymphocele	I89.8
  Lymphocytosis	D72.8
  Lymphogranuloma	C81.9
  Lymphoma	C85.9
  Lymphopenia	D72.8
  Macrodactylia	Q74.0
  Macrodontia	K00.2
  Macrogenitosomia	E25.9
  Macroglobulinemia	C88.0
  Macroglossia	Q38.2
  Macrohydrocephalus	G91.9
  Macromastia	N62
  Macrophthalmos	Q11.3
  Macropsia	H53.1
  Macrotia	Q17.1
  Maculopathy	H35.3
  Maintenance contraception	Z30.4
  Malabsorption	K90.9
  Maladjustment	F43.2
  Malaise	R53
  Malaria	B54
  Malaria, falciparum	B50.9
  Malaria, falciparum mixed with malariae	B50.9
  Malaria, falciparum mixed with ovalae	B50.9
  Malaria, falciparum mixed with vivax	B50.9
  Malaria, malariae	B52.9
  Malaria, malariae mixed with ovalae	B52.9
  Malaria, ovalae	B53.0
  Malaria, unspecified	B54
  Malaria, vivax	B51.9
  Malaria, vivax mixed with malariae	B51.9
  Malaria, vivax mixed with ovalae	B51.9
  Malaria,cerebral	B50.9
  Malignant melanoma at abdominal wall	C43.5
  Malignant melanoma at ankle	C43.7
  Malignant melanoma at arm	C43.6
  Malignant melanoma at back	C43.5
  Malignant melanoma at breast	C43.5
  Malignant melanoma at buttock	C43.5
  Malignant melanoma at chest wall	C43.5
  Malignant melanoma at ear	C43.2
  Malignant melanoma at elbow	C43.6
  Malignant melanoma at eyelid	C43.1
  Malignant melanoma at face	C43.3
  Malignant melanoma at finger	C43.6
  Malignant melanoma at foot	C43.7
  Malignant melanoma at forearm	C43.6
  Malignant melanoma at hand	C43.6
  Malignant melanoma at hip	C43.7
  Malignant melanoma at knee	C43.7
  Malignant melanoma at leg	C43.7
  Malignant melanoma at neck	C43.4
  Malignant melanoma at nose	C43.3
  Malignant melanoma at scalp	C43.4
  Malignant melanoma at shoulder	C43.6
  Malignant melanoma at thigh	C43.7
  Malignant melanoma at toe	C43.7
  Malignant melanoma at wrist	C43.6
  Malingering	Z76.5
  Mallet finger	M20.0
  Mallory weiss syndrome	K22.6
  Malnutrition	E46
  Malnutrition screen	Z13.2
  Malnutrition-related diabetes mellitus	E12.9
  Malnutrition screening	Z13.2
  Malocclusion	K07.4
  Maltreatment syndrome	T74.9
  Malunion of fracture	M84.0
  Mammary Abscess at gestational or puerperal	na
  Mammillitis puerperal	na
  Mammitis puerperal	na
  Mandible fracture	S02.6
  Mandibular fracture	S02.6
  Mania episode	F30.9
  Manic-depressive illness	F31.9
  Manic-depressive psychosis	F31.9
  Manic-depressive reaction	F31.9
  Marasmus	E41
  Marginal anus abscess	K61.0
  Masochism	F65.5
  Mass in abdomen	R19.0
  Mass in breast	N63
  Massive hemoptysis	R04.2
  Mastalgia	N64.4
  Mastitis	N61
  Mastitis gestational or puerperal	na
  Mastitis infective of newborn	na
  Mastitis interstitial gestational or puerperal	na
  Mastitis parenchymatous gestational or puerperal	na
  Mastitis with purulent Abscess at associated with childbirth	na
  Mastitis, associated with childbirth	na
  Mastoiditis	H70.9
  Maternal care for intrauterine death	na
  Maternal care for poor fetal growth	na
  Maternal hemoglobic e trait	na
  Maternal homozygous haemoglobin e	na
  Maternal hypertension	na
  Mature cataract	H26.9
  Maturity onset diabetes	E11.9
  Maturity onset diabetic	E11.9
  Maturity onset diabetic mellitus	E11.9
  Maturity-onset diabetes mellitus	E11.9
  Maxillary sinusitis	J32.0
  Measles	B05.9
  Meatitis	N34.2
  Meconium aspiration syndrome	na
  Medial collateral ligament insufficiency	M23.8
  Medial menicus injury	S83.2
  Medial menicus tear	S83.2
  Mediastinitis	J98.5
  Mediastinum tuberculous, primary (progressive)	A16.8
  Medical abortion	O04.9
  Medical care	Z51.9
  Medical examination	Z00.0
  Medical examination, infant or child	Z00.1
  Megacolon	K59.3
  Megaesophagus	K22.0
  Megalencephaly	Q04.5
  Megarectum	K62.8
  Megasigmoid	K59.3
  Megaureter	N28.8
  Meibomian cyst	H00.0
  Meibomitis	H00.0
  Melaena	K92.1
  Melancholia	F32.9
  Melanoma	C43.9
  Melasma	L81.1
  Melena	K92.1
  Melioidosis	A24.4
  Membrana tympani rupture	H72.9
  Memory loss	R41.3
  Meniere╚├═s disease	H81.0
  Meningismus	R29.1
  Meningitis	G03.9
  Meningocele	Q05.9
  Meningococcal infection	A39.9
  Meningoencephalitis	G04.9
  Meningoencephalocele	Q01.9
  Meningoencephalomyelitis	G04.9
  Meningoencephalomyelopathy	G96.9
  Meningoencephalopathy	G96.9
  Meningomyelitis	G04.9
  Meningomyelocele	Q05.9
  Meningomyeloneuritis	G04.9
  Menometrorrhagia	N92.1
  Menopausal and perimenopausal disorder	N95.9
  Menopause	N95.1
  Menorrhagia	N92.0
  Menstrual irregularity	N92.6
  Menstruation pain	N94.6
  Menstruation, painful	N94.6
  Mental health evaluation	Z00.4
  Mental illness	F99
  Mental retardation	F79.9
  Mental retardation, mild	F70.9
  Mental retardation, moderate	F71.9
  Mental retardation, profound	F73.9
  Mental retardation, severe	F72.9
  Metabolic acidosis	E87.2
  Metastases	C79.9
  Metastasis	C79.9
  Metastatic cancer	C79.9
  Metastatic cancer or neoplasm	C79.9
  Metastatic disease	C79.9
  Metastatic from	C79.9
  Metastatic malignant disease	C79.9
  Metastatic neoplasm	C79.9
  Metastatic neoplasm (disease)	C79.9
  Methemoglobinemia	D74.9
  Methemoglobinuria	R82.3
  Metrorrhagia	N92.1
  Microcephalus	Q02
  Microdontia	K00.2
  Microembolism	H34.2
  Microgenitalia, female	Q52.8
  Microgenitalia, male	Q55.8
  Microglossia	Q38.3
  Microphthalmos	Q11.2
  Micropsia	H53.1
  Microstomia	Q18.5
  Microtia	Q17.2
  Middle cerebral artery infarction	I63.3
  Middle cerebral artery syndrome	I63.3
  Middle cerebral infarction	I63.3
  Middle ear abscess	H66.4
  Midgut volvulus	K56.2
  Migraine	G43.9
  Migraine without aura	G43.9
  Migration	Z60.3
  Mild gastritis	K29.7
  Mild pre eclampsia	na
  Mild preeclampsia	na
  Mild pre-eclampsia	na
  Mild protein-energy malnutrition	E44.1
  Mildcycle of menstruation pain	N94.0
  Miliaria	L74.3
  Miliary tuberculosis	A19.9
  Misadventure	T88.9
  Miscarriage	na
  Missed abortion	O02.1
  Mitral valve disease	I05.9
  Mittelschmerz' s syndrome	N94.0
  Mixed disorder of conduct and emotions	F92.9
  MMR immunization	Z27.4
  Moderae protein-energy malnutrition	E44.0
  Moderate pre-eclampsia	na
  Mole	D22.9
  Molluscum contagiosum	B08.1
  Molluscum verrucosum	B08.2
  Moniliasis	B37.9
  Monkeypox	B04
  Monoarthritis	M13.1
  Mononeuropathy	G58.9
  Mononeuropathy multiplex	G58.9
  Mononeuropathy of lower limb	G57.9
  Mononeuropathy of upper limb	G56.9
  Mononucleosis	B27.9
  Monoplegia	G83.3
  Monteggia╚├═s fracture	S52.0
  Mood (affective) disorder	F39
  Morbid obesity	E66.8
  Morbilli	B05.9
  Mosaic plantar warts	B07
  Mouth breathing	R06.5
  Mouth cellulitis	K12.2
  Mouth ulcers	K12.1
  Mucormycosis	B46.5
  Multinodular (cystic) goitre NOS	E04.2
  Multinodular goiter	E04.2
  Multinodular goiter, toxic or with hyperthyroidism	E05.2
  Multinodular goitre	E04.2
  Multiparity	Z64.1
  Multiple births other than twins, all liveborn	na
  Multiple births other than twins, all stillborn	na
  Multiple births other than twins, some liveborn	na
  Multiple dental caries	K02.9
  Multiple gall stones	K80.2
  Multiple gallstones	K80.2
  Multiple gastric ulcer	K25.9
  Multiple myeloma	C90.0
  Multiple myoma uteri	D25.9
  Multiple nodules goitre	E04.2
  Multiple other than twins, born in hospital	na
  Multiple other than twins, born outside hospital	na
  Multiple sclerosis	G35
  Multiple skin tags	L91.8
  Multiple subserous myoma	D25.2
  Multiple thyroid nodules	E04.2
  Multiple valve disease	I08.9
  Mumps	B26.9
  Murine typhus fever	A75.2
  Muscle cramp	R25.2
  Muscle strain	M62.6
  Muscle weakness	M62.8
  Muscular dystrophy	G71.0
  Muscular pain	M79.1
  Mutism	R47.0
  Myalgia	M79.1
  Myasthenia	G70.0
  Myasthenia gravis	G70.0
  Mycetoma	B47.9
  Mycobacteriosis	A31.9
  Mydriasis	H57.0
  Myelitis	G04.9
  Myelodysplastic syndrome	D46.9
  Myelopathy	G95.9
  Myiasis	B87.9
  Myocardiopathy	I42.9
  Myocarditis	I51.4
  Myoclonus	G25.3
  Myofibromatosis	D48.1
  Myofibrosis	M79.7
  Myofibrositis	M79.7
  Myoglobinuria	R82.1
  Myoma uteri	D25.9
  Myometritis	N71.9
  Myonecrosis	A48.0
  Myopathy	G72.9
  Myopia	H52.1
  Myositis	M60.9
  Myotonia	M62.8
  Myringitis	H73.8
  Myxedema	E03.9
  Nail contusion finger, nail	S60.1
  Nail contusion toe, nail	S90.2
  Nail disorder	L60.9
  Nail injury, superficial, toe nail	S90.2
  Narcolepsy	G47.4
  Narcotism	T40.6
  Nasal abscess	J34.0
  Nasal catarrh, acute	J00
  Nasal fracture	S02.2
  Nasal hypertrophy	J34.8
  Nasal obstruction	J34.8
  Nasal polyp	J33.9
  Nasal septum deviation	J34.2
  Nasal septum injury, superficial	S00.3
  Nasolacrimal duct obstruction	H04.5
  Nasopharyngitis	J00
  Nasopharyngitis infective	J00
  Nasopharyngitis streptococcal	J00
  Nausea	R11
  Navel infection in newborn	na
  Navel inflammation in newborn	na
  Near sighted	H52.1
  Nearsighted	H52.1
  Nearsightedness	H52.1
  Necatoriasis	B76.1
  Neck - burn	T20.0
  Neck abscess	L02.1
  Neck contusion	S10.9
  Neck injury	S19.9
  Necrotizing fasciitis	M72.6
  Necrotizing vasculopathy	M31.9
  Need for immunisation against influenza	Z25.1
  Need for immunisation against tetanus alone	Z23.5
  Need for immunization against arthropod-borne viral encephalitis	Z24.1
  Need for immunization against certain single viral diseases	Z25.8
  Need for immunization against certain specified single infectious diseases	Z26.9
  Need for immunization against certain specified single viral diseases	Z25.8
  Need for immunization against cholera alone	Z23.0
  Need for immunization against cholera with typhoidparatyphoid	Z27.0
  Need for immunization against combinations of infectious diseases	Z27.9
  Need for immunization against diphtheria alone	Z23.6
  Need for immunization against diphtheria-tetanuspertussis with poliomyelitis	Z27.3
  Need for immunization against diphtheria-tetanus with typhoid-paratyphoid	Z27.2
  Need for immunization against diphtheria-tetanuspertussis, combined	Z27.1
  Need for immunization against DTP + polio	Z27.3
  Need for immunization against influenza	Z25.1
  Need for immunization against leishmaniasis	Z26.0
  Need for immunization against measles alone	Z24.4
  Need for immunization against measles-mumps-rubella	Z27.4
  Need for immunization against MMR	Z27.4
  Need for immunization against mumps alone	Z25.0
  Need for immunization against pertussis alone	Z23.7
  Need for immunization against plague	Z23.3
  Need for immunization against poliomyelitis	Z24.0
  Need for immunization against rabies	Z24.2
  Need for immunization against rubella alone	Z24.5
  Need for immunization against single bacterial diseases	Z23.8
  Need for immunization against tetanus alone	Z23.5
  Need for immunization against tuberculosis	Z23.2
  Need for immunization against tularaemia	Z23.4
  Need for immunization against typhoid-paratyphoid alone	Z23.1
  Need for immunization against viral hepatitis	Z24.6
  Need for immunization against yellow fever	Z24.3
  Need for isolation	Z29.0
  Need for prophylactic vaccination with tetanus toxoid alone	Z23.5
  Neglect	T74.0
  Neonatal aspiration of meconium	na
  Neonatal breast abscess	na
  Neonatal goiter	na
  Neonatal goitre	na
  Neonatal gynecomastia	na
  Neonatal hemorrhage	na
  Neonatal herpesviral infection	na
  Neonatal hyperbilirubinemia	na
  Neonatal hypoglycaemia	na
  Neonatal infective mastitis	na
  Neonatal jaundice	na
  Neonatal jaundice breast feeding	na
  Neonatal jaundice due to abo incompatibility	na
  Neonatal jaundice due to breast feeding jaundice	na
  Neonatal jaundice due to breast milk feeding	na
  Neonatal jaundice due to cepholhematoma	na
  Neonatal jaundice due to inconclusive jaundice	na
  Neonatal mastitis	na
  Neonatal sepsis	na
  Neoplasms of uncertain behaviour of skin	D48.5
  Neovascular glaucoma	H40.5
  Nephritic syndrome	N05.9
  Nephritis	N05.9
  Nephroblastoma	C64
  Nephrocalcinosis	E83.5
  Nephrocystitis	N12
  Nephrolithiasis	N20.0
  Nephroma	C64
  Nephropathy	N28.9
  Nephrosis	N04.9
  Nephrostomy	Z93.6
  Nephrostomy status	Z93.6
  Nephrotic syndrome	N04.9
  Nervous trouble	R45.0
  Nervousness	R45.0
  Neuralgia	M79.2
  Neurasthenia	F48.0
  Neuritis	M79.2
  Neuritis optic	H46
  Neuroblastoma	C74.9
  Neurocysticercosis	B69.0
  Neurodermatitis	L28.0
  Neuroencephalomyelopathy optic	G36.0
  Neurofibromatosis	Q85.0
  Neurogenic bladder	N31.9
  Neurogenic dysphagia	F45.8
  Neuroleprosy	A30.9
  Neuromyalgia	M79.2
  Neuromyasthenia	G93.3
  Neuromyelitis	G36.9
  Neuromyelitis optica	G36.0
  Neuromyopathy	G70.9
  Neuromyotonia	G71.1
  Neuronitis	G58.9
  Neuropathy	G62.9
  Neuroretinitis	H30.9
  Neurosis	F48.9
  Neurosyphilis	A25.3
  Neurotic anxiety state	F41.1
  Neutropenia	D70
  Nevus	D22.9
  Newborn	na
  Newborn born in hospital	na
  Newborn born outside hospital	na
  Newborn breast abscess	na
  Newborn fever	na
  Newborn hemorrhage	na
  Newborn infant	na
  Newborn multiple, born in hospital	na
  Newborn multiple, born outside hospital	na
  Newborn trismus	na
  Newborn twin	na
  Newborn twin, born in hospital	na
  Newborn twin, born outside hospital	na
  Newborn vomiting	na
  Niacin deficiency	E52
  Nightmare	F51.5
  Nightmare disorder	F51.5
  Nightmares	F51.5
  Nightmares nos	F51.5
  Nipple fistula, puerperal	na
  Nipple puerperal abscess	na
  Nipple retraction	N64.5
  Nocardiosis	A43.9
  Node thyroid gland	E04.1
  Nodular goiter	E04.9
  Nodular goiter, with hyperthyroidism	E05.2
  Nodular goiter, with thyrotoxicosis	E05.2
  Nodular goitre	E04.9
  Nodular goitre (nontoxic)	E04.9
  Nodule of the thyroid	E04.1
  Nodule of the thyroid gland	E04.1
  Nodule(s) in breast	N63
  Nodule(s)thyroid	E04.1
  Noise exposure	Z58.0
  Non hodgkin's lymphoma	C85.9
  Non insulin dependent diabetic	E11.9
  Non insulin dependent diabetic mellitus	E11.9
  Non st elevate myocardial infarction	I24.8
  Non union fracture	M84.1
  Non-bullous impetigo	L01.0
  Nondiabetic hypoglycaemia	E16.2
  Nondiabetic hypoglycemic coma	E15
  Noninflammatory disorder of cervix uteri	N88.9
  Noninflammatory disorder of uterus	N85.9
  Noninflammatory disorder of vagina	N89.9
  Noninflammatory disorder of vulva and perineum	N90.9
  Non-insulin-dependent diabetes mellitus	E11.9
  Non-insulin-dependent diabetes mellitus without complications	E11.9
  Non-insulin-dependent diabetes of the young	E11.9
  Nonketotic diabetes	E11.9
  Nonlactational abscess	N61
  Nonorganic sleep disorder	F51.9
  Nonpurulent mastitis associated with childbirth	na
  Nonpurulent mastitis associated with childbirth, with mention of attachment difficulty	na
  Nonpurulent mastitis associated with childbirth, without Nonrheumatic mitral valve disorder	I34.9
  Nonrheumatic tricuspid valve disorder	I36.9
  Nonsuppurative otitis media	H65.9
  Nonthermal blister of anterior abdomen	S30.8
  Nonthermal blister of anterior chest	S20.8
  Nonthermal blister of neck	S10.9
  Nonthermal blister of scalp	S00.0
  Nontoxic diffuse goiter	E04.0
  Non-toxic diffuse goiter	E04.0
  Nontoxic diffuse goitre	E04.0
  Non-toxic diffuse goitre	E04.0
  Nontoxic multinodular goiter	E04.2
  Non-toxic multinodular goiter	E04.2
  Nontoxic multinodular goitre	E04.2
  Non-toxic multinodular goitre	E04.2
  Nontoxic nodular goiter	E04.9
  Non-toxic nodular goiter	E04.9
  Nontoxic nodular goiter nos	E04.9
  Non-toxic nodular goitre	E04.9
  Nontoxic single thyroid nodule	E04.1
  Non-toxic single thyroid nodule	E04.1
  Nontoxic uninodular goiter	E04.1
  Non-toxic uninodular goiter	E04.1
  Nontoxic uninodular goitre	E04.1
  Non-toxic uninodular goitre	E04.1
  Nontraumatic pinna hematoma	H61.1
  Nonulcer dyspepsia	K30
  Nonvenereal syphilis	A65
  Nonvenomous bite of scalp	S00.0
  Normal delivery	na
  Normal follow-up examination	Z09.9
  Normal pressure hydrocephalus	G91.2
  Normal tension glaucoma	H40.1
  Norwegian scabies	B86
  Nose abscess	J34.0
  Nose cellulitis	J34.0
  Nose polyp	J33.9
  Nosebleed	R04.0
  Nosophobia	F45.2
  Nostalgia	F43.2
  Not getting enough sleep	G47.0
  Nuclear cataract	H25.1
  Nutritional anemia	D53.9
  Nutritional deficiency	E63.9
  Nutritional short stature	E45
  Nymphomania	F52.7
  Nystagmus	H55
  Obese	E66.9
  Obesity	E66.9
  Obsructive sleep apnea	G47.3
  Obstetric death	na
  Obstetric surgical wound, infection	na
  Obstetric tetanus	na
  Obstetrical tetanus	na
  Obstipation	K59.0
  Obstructed labor	na
  Obstructed labour	na
  Obstruction hydrocephalus	G91.1
  Obstruction lung disease	J44.9
  Observation for suspected disease or condition	Z03.9
  Obsessive-compulsive disorder	F42.9
  Obstruction sleep apnea	G47.3
  Obstructive uropathy	N13.9
  Occult bacteremia	A49.9
  Occult blood in stools	R19.5
  Occupational health examination	Z10.0
  Ocular pain	H57.1
  Oedema of pregnancy	na
  Old cerebrovascula accident	I69.4
  Old myocardial infarction	I25.2
  Oligohydramnios	na
  Oligomenorrhea	N91.5
  Oligospermia	N46
  Oliguria	R34
  Omphalitis of newborn	na
  Omphalocele	Q79.2
  Onchocerciasis	B73
  Onychomycosis	B35.1
  Onychomycosis due to dermatophyte	B35.1
  Onychomycosis of fingernail due to dermatophyte	B35.1
  Onychomycosis of toenail due to dermatophyte	B35.1
  Oophoritis	N70.9
  Open bite of abdomen, lower back or pelvis	S31.8
  Open bite of ankle or foot	S91.3
  Open bite of head	S01.9
  Open bite of hip	S71.0
  Open bite of lower leg	S81.8
  Open bite of neck	S11.9
  Open bite of shoulder or upper arm	S41.8
  Open bite of thigh	S71.1
  Open bite of thorax	S21.9
  Open bite of toe with damage to nail	S91.2
  Open depressed skull fracture	S02.0
  Open wound of abdomen, lower back or pelvis	S31.7
  Open wound of abdomen, lower back or pelvis, unspecified	S31.8
  Open wound of ankle	S91.0
  Open wound of ankle or foot	S91.3
  Open wound of axilla	S41.8
  Open wound of breast	S21.0
  Open wound of cheek	S01.4
  Open wound of ear	S01.3
  Open wound of elbow	S51.0
  Open wound of eyelid	S01.1
  Open wound of face	S01.8
  Open wound of finger	S61.0
  Open wound of finger with damage to nail	S61.1
  Open wound of finger without damage to nail	S61.0
  Open wound of finger(s)	S61.0
  Open wound of forearm	S51.7
  Open wound of hip	S71.0
  Open wound of knee	S81.0
  Open wound of lip	S01.5
  Open wound of lower leg	S81.8
  Open wound of neck	S11.9
  Open wound of nose	S01.2
  Open wound of scalp	S01.0
  Open wound of shoulder	S41.0
  Open wound of thigh	S71.1
  Open wound of thorax	S21.9
  Open wound of thumb	S61.0
  Open wound of thumb with damage to nail	S61.1
  Open wound of toe	S91.1
  Open wound of toe with damage to nail	S91.2
  Open wound of toe without damage to nail	S91.1
  Open wound of toe(s)	S91.1
  Open wound of upper arm	S41.1
  Open wound of wrist	S61.8
  Openbite	K07.2
  Ophthalmic graves disease	E05.0
  Ophthalmitis	H10.9
  Optic atrophy	H47.2
  Optic neuritis	H46
  Oral aphthae	K12.0
  Oral aphthous ulcers	K12.0
  Oral thrush	B37.0
  Oral ulcer	K12.1
  Orbital cellulitis	H05.0
  Orchitis	N45.9
  Organic amnesic syndrome	F04
  Organic brain syndrome	F06.9
  Organic psychosis	F09
  Organic psychosyndrome	F07.9
  Orthopedic follow-up care	Z47.9
  Orthostatic hypotension	I95.1
  Osteitis	M86.9
  Osteoarthritis	M19.9
  Osteoarthritis hip	M16.9
  Osteoarthritis knee	M17.9
  Osteoarthritis of both knee	M17.9
  Osteoarthropathy	M19.9
  Osteoarthrosis of hip	M16.9
  Osteoarthrosis of knee	M17.9
  Osteochondritis	M93.9
  Osteochondrodysplasia	Q78.9
  Osteochondrodystrophy	Q78.9
  Osteochondropathy	M93.9
  Osteochondrosis	M93.9
  Osteodynia	M89.8
  Osteodystrophy	Q78.9
  Osteolysis	M89.5
  Osteomalacia	M83.9
  Osteomyelitis	M86.9
  Osteonecrosis	M87.9
  Osteopoikilosis	Q78.8
  Osteoporosis	M81.9
  Osteosclerosis	Q78.2
  Otalgia	H92.0
  Other acquired deformities of limbs	M21.9
  Other assisted breech delivery	na
  Other specified fibroadenoma of breast	D24
  Other specified infections of breast associated with Other specified infestation by Sarcoptes	B86
  Otitis	H66.9
  Otitis externa	H60.9
  Otitis media	H66.9
  Otomycosis	B36.9
  Otorrhagia	H92.2
  Otorrhea	H92.1
  Otorrhoea	H92.1
  Otosclerosis	H80.9
  Outcome of delivery multiple, all liveborn	na
  Outcome of delivery multiple, all stillborn	na
  Outcome of delivery multiple, some liveborn	na
  Outcome of delivery single	na
  Outcome of delivery single, liveborn	na
  Outcome of delivery single, stillborn	na
  Outcome of delivery, twins both liveborn	na
  Outcome of delivery, twins both stillborn	na
  Ovarian cyst	N83.2
  Ovarian dysfunction	E28.9
  Ovarian hyperstimulation	N98.1
  Ovarian pregnancy	O00.2
  Ovaritis	N70.9
  Overactivity	R46.3
  Overbite	K07.2
  Overexertion	T73.3
  Overexposure	T73.9
  Overfeeding	R63.2
  Overheated	T67.9
  Overnutrition	R63.2
  Overweight	E66.9
  Overweight and localized adiposity	E66.9
  Overweight and obesity	E66.9
  Overweight in adults	E66.9
  Overweight, unspecified	E66.9
  Oxyuriasis	B80
  Pachyderma	L85.9
  Pachymeningitis	G03.9
  Pachyonychia	Q84.5
  Paget disease of bone	M88.9
  Pain	R52.9
  Pain colon	R10.4
  Pain in arm	M79.6
  Pain in breast	N64.4
  Pain in chest	R07.4
  Pain in ear	H92.0
  Pain in finger	M79.6
  Pain in foot	M79.6
  Pain in hand	M79.6
  Pain in joint	M25.5
  Pain in leg	M79.6
  Pain in penis	N48.8
  Pain in throat	R07.0
  Pain in toe	M79.6
  Pain in upper limb	M79.6
  Pain of breast	N64.4
  Pain of upper limb	M79.6
  Pain over heart	R07.2
  Pain upper abdomen	R10.1
  Painful intercourse	N94.1
  Painful menses	N94.6
  Painful menstruation	N94.6
  Painful urination	R30.9
  Palpitations	R00.2
  Panarteritis nodosa	M30.0
  Pancarditis	I51.8
  Pancreatic fistula	K86.8
  Pancreatitis	K85.9
  Pancytopenia	D61.9
  Panencephalitis	A81.1
  Panhematopenia	D61.9
  Panhemocytopenia	D61.9
  Panhypopituitarism	E23.0
  Panic	F41.0
  Panneuritis endemica	E51.1
  Panniculitis	M79.3
  Panophthalmitis	H44.0
  Pansinusitis	J32.4
  Panuveitis	H44.1
  Papanicolaou smear of cervix	Z01.4
  Papilledema	H47.1
  Papillitis	H46
  Papules	R23.8
  Papulosquamous disorder	L44.9
  Paracoccidioidomycosis	B41.9
  Paraffinoma	T88.8
  Paralysis	G83.9
  Paralysis of leg	G83.1
  Paralysis of lower limb	G83.1
  Paralytic strabismus	H49.9
  Parametritis	N73.2
  Paranoia	F22.0
  Paranoid	F22.0
  Paraparesis	G82.2
  Paraphimosis	N47
  Paraplegia	G82.2
  Parapsoriasis	L41.9
  Parasomnia	G47.8
  Paraspadias	Q54.9
  Paratyphoid fever	A01.4
  Paraurethritis	N34.2
  Parencephalitis	G04.9
  Parkinson╚├═s disease	G20
  Parkinsonism	G20
  Parodontitis	K05.3
  Parodontosis	K05.4
  Paronychia	L03.0
  Parotitis	K11.2
  Paroxymal ventricular tachycardia	I47.2
  Paroxysmal supraventricular tachycardia	I47.1
  Paroxysmal tachycardia	I47.9
  Partial accommodative esotropia	H50.0
  Partial colonic obstruction	K56.6
  Partial gut obstruction	K56.6
  Partial small bowel obstruction	K56.6
  Partial small bowel obstruction from adhesion band	K56.6
  Parturition	na
  Passive smoking	Z58.7
  Past myocardial infarct	I25.2
  Past myocardial infarction	I25.2
  Past myocardium infarct	I25.2
  Past myocardium infarction	I25.2
  Patent ductus arteriosus	Q25.0
  Pathologic phimosis	N47
  Pediculosis	B85.2
  Pediculosis and phthiriasis	B85.4
  Pediculosis capitis	B85.0
  Pediculosis corporis	B85.1
  Pediculosis exposure	Z20.7
  Pediculus capitis infestation	B85.0
  Pediculus corporis infestation	B85.1
  Peiodic paralysis	G72.3
  Peliosis	D69.0
  Pellagra	E52
  Pelvic endometriosis	N80.3
  Pelvic inflammatory disease	N73.9
  Pelvic pain	R10.2
  Pelvic peritoneal adhesion, female	N73.6
  Pelvic peritoneal adhesion, male	K66.0
  Pelvic seperation, obstetrical trauma	O71.6
  Pelviperitonitis	N73.5
  Pelvis pain	R10.2
  Pemphigoid	L12.9
  Pemphigus	L10.9
  Pemphigus vulgaris	L10.0
  Penile warts	A63.0
  Penis syphilitic	A51.0
  Penitis	N48.2
  Peptic ulcer	K27.9
  Peptic ulcer perforation	K27.5
  Per excitiation syndrome	I45.6
  Perforated cornea	S05.6
  Perforated eardrum	H72.9
  Perforated tympanic membrane	H72.9
  Perforating globe	S05.6
  Perforation of ear drum	H72.9
  Perforation of ear drum nos	H72.9
  Perforation of eardrum	H72.9
  Perforation of tympanic membrane	H72.9
  Perforation tympanic membrane	H72.9
  Perforation tympanum	H72.9
  Perianal abscess	K61.0
  Perianal fistula	K60.3
  Perianal warts	A63.0
  Periappendicitis	K37
  Periarteritis nodosa	M30.0
  Periarthritis	M77.9
  Periarthrosis	M77.9
  Pericapsulitis	M75.0
  Pericarditis	I31.9
  Pericellulitis	L03.9
  Pericoronitis	K05.3
  Peridiverticulitis	K57.9
  Periendocarditis	I38
  Periepididymitis	N45.9
  Perifolliculitis	L08.8
  Perihepatitis	K65.8
  Perilabyrinthitis	H83.0
  Perimeningitis	G03.9
  Perimetritis	N71.9
  Perimetrosalpingitis	N70.9
  Perineal hematoma	S30.2
  Perineal laceration during delivery	na
  Perineum hematoma	S30.2
  Perineum repair, infection	na
  Perineum tear, obstetrics	na
  Perineuritis	M79.2
  Periodic breast fibroadenosis	N60.2
  Periodic examination (annual)(physical)	Z00.0
  Periodontitis	K05.3
  Periodontosis	K05.4
  Perionychia	L03.0
  Perioophoritis	N70.9
  Periorchitis	N45.9
  Periostitis	M86.9
  Periostosis	M89.8
  Peripheral arteriovenous malformation	Q27.3
  Peripheral vertigo	H81.3
  Periphlebitis	I80.9
  Periproctitis	K62.8
  Periprostatitis	N41.9
  Perisalpingitis	N70.9
  Perisplenitis	D73.8
  Peritendinitis	M75.0
  Peritonitis	K65.9
  Peritonsillar abscess	J36
  Peritonsillitis	J03.9
  Periureteritis	N28.8
  Periurethritis	N34.2
  Perivaginitis	N76.0
  Perivasculitis, retinal	H35.0
  Perivesiculitis	N49.0
  Pernicious anemia	D51.0
  Persistent delusional disorder	F22.9
  Persistent gestational trophoblastic disease	O01.9
  Persistent mood (affective) disorder	F34.9
  Personal history of tobacco use disorder	Z72.0
  Personality disorder	F60.9
  Pertussis	A37.9
  Petrositis	H70.2
  Pervasive developmental disorder	F84.9
  Phacomorphic glaucoma	H40.5
  Phakoma	H35.8
  Phakomatosis	Q85.9
  Pharyngitis	J02.9
  Pharyngoconjunctivitis, viral	B30.2
  Pharyngolaryngitis	J06.0
  Pharyngotonsillitis	J06.8
  Pharyngotracheitis	J06.8
  Phenylketonuria	E70.1
  Pheochromocytoma	C74.1
  Philippine hemorrhagic fever	A97.0
  Phimosis	N47
  Phlebitis	I80.9
  Phobia	F40.9
  Phocomelia	Q73.1
  Photodermatitis	L56.8
  Photokeratitis	H16.1
  Photophobia	H53.1
  Photoretinitis	H31.0
  Photosensitivity	L56.8
  Phthiriasis	B85.3
  Phthiriasis pubis	B85.3
  Phthirus pubis infestation	B85.3
  Phthisis	A16.9
  Phthisis bulbi	H44.5
  Physical Abuse of (event)	T74.1
  Physical and mental strain	Z73.3
  Phytobezoar	T18.9
  Pian	A66.9
  Pica	F50.8
  PID - pelvic inflammatory disease	N73.9
  Piles	K64.9
  Piles - hemorrhoids	K64.9
  Pilonidal cyst	L05.9
  Pinealoma	D44.5
  Pinguecula	H11.1
  Pingueculae	H11.1
  Pinna hematoma	S00.4
  Pinna, cellulitis	H60.1
  Pinta	A67.9
  Pintids	A67.9
  Pinworm	B80
  Pityriasis	L21.0
  Pityriasis rosea	L42
  Pityriasis versicolor	B36.0
  Placenta acreta	na
  Placenta posterior cover os	na
  Placenta praevia	na
  Placenta previa low lying	na
  Placenta previa totalis	na
  Placentitis	na
  Plague	A20.9
  Plane warts	B07
  Plantar warts	B07
  Plasmacytoma	C90.2
  Plaster ulcer	L89.9
  Platyonychia	Q84.6
  Platyspondylisis	Q76.4
  Pleural effusion	J90
  Pleural plaque	J92.9
  Pleuralgia	R07.3
  Pleurisy	R09.1
  Pleurodynia	R07.3
  Pleuropericarditis	I31.9
  Pleuropneumonia	J18.8
  Plummer	E05.2
  Plummer's disease	E05.2
  Pneumatocele	J98.4
  Pneumaturia	R39.8
  Pneumocephalus	G93.8
  Pneumoconiosis	J64
  Pneumocystis carinii pneumonia	B59
  Pneumocystosis	B59
  Pneumohemopericardium	I31.9
  Pneumohemothorax	J94.2
  Pneumohydropericardium	I31.9
  Pneumohydrothorax	J94.8
  Pneumomediastinum	J98.2
  Pneumomycosis	B49
  Pneumonia	J18.9
  Pneumonia due to klebsiella pneumoniae	J15.0
  Pneumonia due to streptococcal pneumonia	J13
  Pneumonia lobar	J18.1
  Pneumonitis	J18.9
  Pneumopericarditis	I31.9
  Pneumopericardium	I30.1
  Pneumophagia	F45.3
  Pneumopleurisy	J18.8
  Pneumopyopericardium	J30.1
  Pneumopyothorax	J86.9
  Pneumorrhagia	R04.3
  Pneumothorax	J93.9
  Podencephalus	Q01.9
  Poikilocytosis	R71
  Poikiloderma	L81.6
  Poikilodermatomyositis	M33.1
  Poisoning	T64.9
  Poisoning by snake venom	T63.0
  Poisoning due to venomous spider	T63.3
  Poisonous bite	T63.9
  Polioencephalitis	A80.9
  Polioencephalomyelitis	A80.9
  Poliomeningoencephalitis	A80.9
  Poliomyelitis	A80.9
  Polyadenitis	I88.9
  Polyangiitis	M30.0
  Polyarteritis nodosa	M30.0
  Polyarthralgia	M25.5
  Polyarthritis	M13.0
  Polyarthritis juvenile rheumatoid arthritis	M08.0
  Polyarthrosis	M15.9
  Polychondritis	M94.8
  Polycystic kidney disease	Q61.3
  Polycythemia	D45
  Polydactylism	Q69.9
  Polydactyly of fingers	Q69.9
  Polydactyly, unspecified	Q69.9
  Polydipsia	R63.1
  Polyglandular dysfunction	E31.9
  Polyhydramnios	na
  Polymenorrhea	N92.0
  Polymyalgia	M35.3
  Polymyositis	M33.2
  Polyneuritis	G62.9
  Polyneuropathy	G62.9
  Polyopia	H53.8
  Polyorchism	Q55.2
  Polyp of female genital tract	N84.9
  Polyp of skin	L98.8
  Polyphagia	R63.2
  Polyradiculitis	G62.9
  Polyradiculoneuropathy	G61.0
  Polysyndactyly	Q70.4
  Polyuria	R35
  Pontine hemorrhage	I61.3
  Pontine infarction	I63.8
  Poor closure eyelids	H02.2
  Poor contraction, labor	na
  Poor maternal effort	na
  Porphyria	E80.2
  Portal hypertensive gastropathy	K31.8
  Portal vein thrombosis	I81
  Positive test for hiv	R75
  Post menopausal bleeding	N95.0
  Post operative endophthalmitis	H44.1
  Post operative wound disruption	T81.3
  Post term	na
  Post term partum	na
  Post traumatic osteoarthritis	M19.1
  Post traumatic wound infected	T79.3
  Postcoital and contact bleeding	N93.0
  Postconcussional syndrome	F07.2
  Post-dates	na
  Posterior cruciate ligament injury	S83.5
  Posterior cruciate ligament insufficiency	S83.5
  Posterior cruciate ligament tear	S83.5
  Posterior intraocular len dislocation	H27.1
  Posterior lens dislocation	H27.1
  Posthaemorrhagic anemia	D62
  Posthaemorrhagic anemia (chronic)	D50.0
  Postmenopausal bleeding	N95.0
  Postoperative bleeding	T81.0
  Postoperative hemorrhage	T81.0
  Postpartum care and examination	na
  Postpartum haemorrhage	na
  Postpartum mastitis	na
  Postpolio syndrome	G14
  Post-term	na
  Post-term infant	na
  Post-term pregnancy	na
  Postural othostatic hypotension	I95.1
  Pre eclampsia	na
  Pre existing diabetes mellitus	na
  Preauricular sinus	Q18.1
  Precerebral artery occlusion	I65.9
  Precipitate delivery	na
  Precipitate labour	na
  Precocious puberty	E30.1
  Precordial pain	R07.2
  Prediabetes	R73.0
  Pre-eclampsia	na
  Pre-employment examination	Z02.1
  Pre-employment medical examination	Z02.1
  Pre-existing diabetes mellitus pregnancy	na
  Pregnancy confirmed	Z32.1
  Pregnancy examination	Z32.0
  Pregnancy false labor	na
  Pregnancy lymphadenitis breast	na
  Pregnancy lymphangitis breast	na
  Pregnancy phlebitis	na
  Pregnancy proteinuria	na
  Pregnancy supervision for multiparity	na
  Pregnancy test	Z32.0
  Pregnancy, not confirmed	Z32.0
  Pregnancy, not yet confirmed	Z32.0
  Pregnant state	Z33
  Pregnant state, incidental	Z33
  Premature rupture of membranes	na
  Prematurity	na
  Prepuce Abrasion at	S30.2
  Prepuce contusion	S30.2
  Prepylonic gastric ulcer	K25.9
  Prepylonic ulcer	K25.9
  Pre-pyloric gastric ulcer bleeding	K25.4
  Presbyacusis	H91.1
  Presbycusis	H91.1
  Presbyopia	H52.4
  Prescription contraception, repeat	Z30.4
  Prescription contraceptives, repeat	Z30.4
  Presence of artificial opening	Z93.9
  Presence of colostomy	Z93.3
  Presence of cystostomy	Z93.5
  Presence of gastrostomy	Z93.1
  Presence of ileostomy	Z93.2
  Presence of tracheostomy	Z93.0
  Pressure necrosis of skin	L89.9
  Pressure sore	L89.9
  Pressure ulcer	L89.9
  Presyncope	R55
  Preterm	na
  Preterm delivery	na
  Preterm labor	na
  Preterm labor pain	na
  Preterm labour	na
  Preterm labour and delivery	na
  Preterm labour pain	na
  Preterm labour with preterm delivery	na
  Preterm labour with term delivery	na
  Preterm labour without delivery	na
  Preterm low birth weight	na
  Preterm newborn	na
  Priapism	N48.3
  Primary angle closure glaucoma	H40.2
  Primary gonarthrosis	M17.1
  Primary hypertension	I10
  Primary inadequate contractions	na
  Primary infertility, female	N97.9
  Primary infertility, male	N46
  Primary open angle glaucoma	H40.2
  Primary osteoarthritis knee	M17.1
  Primary respiratory tuberculosis	A16.9
  Primary respiratory tuberculosis without mention of bacteriological or histological confirmation	A16.9
  Primary tuberculosis	A16.9
  Primary tuberculous	A16.9
  Primary tuberculous infection	A16.9
  Problem housing, inadequate	Z59.1
  Problem imprisonment or incarceration	Z65.1
  Problem release from prison	Z65.2
  Problems related to exposure to noise	Z58.0
  Procedure not carried out	Z53.9
  Procidentia uteri	N81.3
  Procreative management	Z31.9
  Proctalgia	K62.8
  Proctitis	K62.8
  Proctocele, female	N81.6
  Proctocele, male	K62.3
  Proctocolitis mucosal	K51.5
  Proctoptosis	K62.3
  Proctorrhagia	K62.5
  Proctosigmoiditis	K63.8
  Proctospasm	K59.4
  Prognathism	K07.1
  Prolapse internal hameorrhoids	K64.9
  Prolapse uteri	N81.4
  Proliferative diabetic retinopathy	E14.3
  Prolong fever	R50.9
  Prolong premature rupture of membranes	na
  Prolonged labor	na
  Prolonged second stage	na
  PROM- premature rupture of membranes	na
  Prophylactic surgery	Z40.9
  Prophylactic vaccination against arthropod-borne viral encephalitis	Z24.1
  Prophylactic vaccination against influenza	Z25.1
  Prostatism	N40
  Prostatitis	N41.9
  Proteinemia	R77.9
  Proteinuria	R80
  Proteinuria complicating pregnancy	na
  Pruritus	L29.9
  Pseudarthrosis	M84.1
  Pseudoaneurysm	I72.9
  Pseudoarthrosis	M84.1
  Pseudocirrhosis	I31.1
  Pseudocowpox	B08.0
  Pseudocoxalgia	M91.3
  Pseudocroup	J38.5
  Pseudocyst of pancreas	K86.3
  Pseudoexfoliation	H26.8
  Pseudofolliculitis	L73.1
  Pseudoglioma	H44.8
  Pseudogout	M11.8
  Pseudohemophilia	D68.0
  Pseudohermaphroditism	Q56.3
  Pseudohypoparathyroidism	E20.1
  Pseudomeningocele	G97.8
  Pseudomenses	na
  Pseudomenstruation	na
  Pseudomyxoma	C78.6
  Pseudoneuritis	Q14.2
  Pseudopapilledema	H47.3
  Pseudoparalysis	R29.8
  Pseudophakia	Z96.1
  Pseudopolycythemia	D75.1
  Pseudopolyposis of colon	K51.4
  Pseudopterygium	H11.8
  Pseudopuberty	E25.8
  Pseudorickets	N25.0
  Pseudorubella	B08.2
  Pseudosclerema	na
  Pseudotetanus	R56.8
  Pseudotetany	R29.0
  Pseudotuberculosis	A28.2
  Psilosis	K90.1
  Psittacosis	A70
  Psoas abscess	M60.0
  Psoriasis	L40.9
  Psychasthenia	F48.8
  Psychogenic physiological dysfunction	F59
  Psychoneurosis	F48.9
  Psychosexual development disorder	F66.9
  Psychosis	F29
  Pterygium	H11.0
  Pterygium of eye	H11.0
  Pterygium, unspecified	H11.0
  Ptosis	H02.4
  Ptosis of eyelid	H02.4
  PU - peptic ulcer	K27.9
  Pubic crab-louse infestation	B85.3
  Pubic louse infestation	B85.3
  Pud - peptic ulcer disease	K27.9
  Puerperal breast abscess	na
  Puerperal hemorrhage	na
  Puerperal infection	na
  Puerperal infection NOS	na
  Puerperal lymphangitis breast	na
  Puerperal lymphangitis of breast	na
  Puerperal mamillitis	na
  Puerperal mammary abscess	na
  Puerperal mastitis	na
  Puerperal mastitis nos	na
  Puerperal purulent mastitis	na
  Puerperal pyrexia	na
  Puerperal pyrexia NOS	na
  Puerperal sepsis	na
  Puerperal subareolar abscess	na
  Puerperal tetanus	na
  Puerperium Abscess at Bartholin's gland	na
  Puerperium Abscess at genital organ	na
  Puerperium Abscess at nipple	na
  Puerperium Abscess at subareolar	na
  Puerperium areola, abscess	na
  Puerperium breast, abscess	na
  Puerperium death	na
  Puerperium galactophoritis	na
  Puerperium infection, nipple	na
  Puerperium lymphangitis, breast	na
  Puerperium mammitis	na
  Puerperium mammitis, purulent	na
  Puerperium mastitis	na
  Puerperium mastitis, purulent	na
  Puerperium nipple fistula	na
  Puerperium pyrexia	na
  Puerperium tetanus	na
  Puerperium thelitis	na
  Pulmonary atresia	Q25.5
  Pulmonary edema	J81
  Pulmonary embolism	I26.9
  Pulmonary stenosis	I37.0
  Pulmonary tuberculosis	A16.2
  Pulmonary tuberculous	A16.2
  Pulmonary tuberculous, childhood type or first infection	A16.2
  Pulmonary tuberculous, primary (complex)	A16.2
  Pulmonary tuberculous, without mention of bacteriological or histological confirmation	A16.2
  Pulmonary valve disorder	I37.9
  Pulpitis	K04.0
  Pulse weakness	R09.8
  Puncture wound with foreign body of head	S01.9
  Puncture wound without foreign body of head	S01.9
  Purpura	D69.2
  Purulent mastitis associated with childbirth	na
  Purulent mastitis gestational or puerperal	na
  Purulent urinary	N39.0
  Pus in urine	N39.0
  Pustule	L08.9
  Pyarthritis	M00.9
  Pyelitis	N12
  Pyelocystitis	N12
  Pyelonephritis	N12
  Pyelonephrosis	N11.1
  Pyelophlebitis	I80.8
  Pyeloureteritis cystica	N28.8
  Pyemia	A41.9
  Pylephlebitis	K75.1
  Pylethrombophlebitis	K75.1
  Pyloric obstruction	K31.1
  Pyloric stricture	K31.1
  Pyloritis	K29.9
  Pylorospasm	K31.3
  Pyoarthrosis	M00.9
  Pyocolpos	N76.0
  Pyocystitis	N30.8
  Pyoderma	L08.0
  Pyoderma gangrenosum	L88
  Pyodermatitis	L08.0
  Pyogenic Abscess at skin at abdominal wall	L02.2
  Pyogenic Abscess at skin at ankle	L02.4
  Pyogenic Abscess at skin at arm	L02.4
  Pyogenic Abscess at skin at back	L02.2
  Pyogenic Abscess at skin at breast	N61
  Pyogenic Abscess at skin at buttock	L02.3
  Pyogenic Abscess at skin at chest wall	L02.2
  Pyogenic Abscess at skin at ear	H60.0
  Pyogenic Abscess at skin at elbow	L02.4
  Pyogenic Abscess at skin at eyelid	H00.0
  Pyogenic Abscess at skin at face	L02.0
  Pyogenic Abscess at skin at finger	L02.4
  Pyogenic Abscess at skin at foot	L02.4
  Pyogenic Abscess at skin at forearm	L02.4
  Pyogenic Abscess at skin at hand	L02.4
  Pyogenic Abscess at skin at hip	L02.4
  Pyogenic Abscess at skin at knee	L02.4
  Pyogenic Abscess at skin at leg	L02.4
  Pyogenic Abscess at skin at neck	L02.1
  Pyogenic Abscess at skin at nose	J34.0
  Pyogenic Abscess at skin at scalp	L02.8
  Pyogenic Abscess at skin at shoulder	L02.4
  Pyogenic Abscess at skin at thigh	L02.4
  Pyogenic Abscess at skin at toe	L02.4
  Pyogenic Abscess at skin at wrist	L02.4
  Pyogenic arthritis	M00.9
  Pyometra	N71.9
  Pyomyositis	M60.0
  Pyonephritis	N12
  Pyonephrosis	N13.6
  Pyopericarditis	I30.1
  Pyophlebitis	I80.9
  Pyopneumopericardium	I30.1
  Pyopneumothorax	J86.9
  Pyosalpinx	N70.9
  Pyosepticemia	A41.9
  Pyothorax	J86.9
  Pyoureter	N28.8
  Pyrexia	R50.9
  Pyromania	F63.1
  Pyuria	N39.0
  Q fever	A78
  Quadriplegia	G82.5
  Quadruplet pregnancy	na
  Quinsy	J36
  Rabies	A82.9
  Rabies contact	Z20.3
  Race discrimination	Z60.5
  Radial tunnel syndrome	G56.3
  Radiation cystitis	N30.4
  Radiation proctitis	K62.7
  Radiation sickness	T66
  Radiculitis	M54.1
  Radiculomyelitis	G04.9
  Radiculopathy	M54.1
  Radiodermatitis	L58.9
  Raped victim	T74.2
  Rapidly progressie nephritic syndrome	N01.9
  Rash	R21
  Rat-bite fever	A25.9
  Reaction to severe stress	F43.9
  Reactive airway disease	J68.3
  Reactive arthritis	M13.8
  Reactive arthropathy	M02.9
  Reactive psychosis	F23.9
  Rectal or anal pain	R10.3
  Rectal polyp	K62.1
  Rectal prolapse	K62.3
  Rectal ulcer	K62.6
  Rectalgia	K62.8
  Rectitis	K62.8
  Rectocele, female	N81.6
  Rectocele, male	K62.3
  Rectosigmoiditis	K63.8
  Rectovaginal fistula	N82.3
  Recurrent acute pyelonephritis	N10
  Recurrent and persistent hematuria	N02.9
  Recurrent anterior shoulder dislocation	M24.4
  Recurrent depressive disorder	F33.9
  Recurrent gut obstruction	K56.6
  Recurrent herpes infection	B00.9
  Recurrent indirect inguinal hernia	K40.9
  Recurrent nasolacrimal duct obstruction	H04.5
  Recurrent pneumonia	J18.9
  Recurrent pterygium of eye	H11.0
  Recurrent shoulder dislocation	M24.4
  Recurrent spontaneous pneumothorax	J93.9
  Recurrent stroke	I64
  Recurrent urinary tract infection	N39.0
  Reduced mobility	Z74.0
  Reflex syncope	G90.0
  Reflux esophagitis	K21.0
  Refractive error	H52.7
  Rehabilitation	Z50.9
  Reinsertion intrauterine contraceptive device	Z30.5
  Relapsing fever	A68.9
  Removal of dressing	Z48.0
  Removal of suture	Z48.0
  Removal of sutures	Z48.0
  Renal calculi	N20.0
  Renal colic	N23
  Renal insufficiency	N19
  Renal stone	N20.0
  Repeat prescription for contraceptive pill or other contraceptive drugs	Z30.4
  Repeat prescription of contraceptives	Z30.4
  Respiratory disease	J98.9
  Respiratory distress in newborn	na
  Respiratory failure	J96.9
  Respiratory pain	R07.1
  Respiratory TB	A16.9
  Respiratory tract foreign body	T17.9
  Respiratory tuberculosis, not confirmed	A16.9
  Respiratory tuberculous, primary	A16.9
  Respiratory tuberculous, primary, with bacteriological and histological confirmation	A15.9
  Restlessness	R45.1
  Retain foreign body in anterior chamber of eye	H44.7
  Retained foreign body in eyelid	H02.8
  Retained foreign body in lower eyelid	H02.8
  Retained foreign body in upper eyelid	H02.8
  Retained placenta	na
  Retention of urine	R33
  Retinal detachment	H33.2
  Retinitis	H30.9
  Retinoblastoma	C69.2
  Retinochoroiditis	H30.3
  Retinopathy	H35.0
  Retracted nipple associated with childbirth	na
  Retraction nipple, gestational	na
  Retraction nipple, puerperal, postpartum	na
  Retroperitoneal hemorrhage	R58
  Rhabdomyolysis	M62.8
  Rhabdomyoma	D21.9
  Rhabdomyosarcoma	C49.9
  Rhabdosarcoma	C49.9
  Rhegmatogenous retinal detachment	H33.0
  Rheumatic aortic valve disease	I06.9
  Rheumatic chorea	I02.9
  Rheumatic fever	I00
  Rheumatic heart disease	I09.9
  Rheumatic mitral insufficiency	I05.1
  Rheumatic tricuspid valve disease	I07.9
  Rheumatiod arthritis	I00
  Rheumatism	M79.0
  Rheumatoid arthritis	M06.9
  Rhinitis	J31.0
  Rhinitis acute	J00
  Rhinitis infective	J00
  Rhinitis pneumococcal	J00
  Rhinoantritis	J32.0
  Rhinodacryolith	H04.5
  Rhinolith	J34.8
  Rhinomegaly	J34.8
  Rhinopharyngitis	J00
  Rhinorrhoea	J34.8
  Rhinosalpingitis	H68.0
  Rhinoscleroma	A48.8
  Rhinosporidiosis	B48.1
  Rhytidosis facialis	L98.8
  Rib fracture	S22.3
  Rickets	E55.0
  Rickettsiosis	A79.9
  Ringworm	B35.9
  Ringworm of beard	B35.0
  Ringworm of face	B35.8
  Ringworm of foot	B35.3
  Ringworm of groin	B35.4
  Ringworm of nails	B35.1
  Ringworm of perianal area	B35.8
  Ringworm of the hand	B35.2
  Ringworm of trunk and limbs	B35.8
  Rosacea	L71.9
  Roseola infantum	B08.2
  Rotator cuff tear	M75.1
  Routine chest X-ray	Z01.6
  Routine child health examination	Z00.1
  Routine postpartum follow-up	na
  Rubella	B06.9
  Rubella [german measles]	B06.9
  Rubella contact	Z20.4
  Rubella exposure	Z20.4
  Rubeola	B05.9
  Rubeosis iris	H21.1
  Rupture achilles tendon	S86.9
  Rupture aneurysm	I72.9
  Rupture appendicitis	K35.3
  Rupture bladder, nontraumatic	N32.4
  Rupture bladder, traumatic	S37.2
  Rupture bowel, nontraumatic	K63.1
  Rupture bowel, traumatic	S36.4
  Rupture cerebral aneurysm	I60.9
  Rupture colon, nontraumatic	K63.1
  Rupture colon, traumatic	S36.5
  Rupture corpus luteum cyst	N83.1
  Rupture ear drum	H72.9
  Rupture ear drum, nontraumatic	H72.9
  Rupture ear drum, traumatic	S09.2
  Rupture globe	S05.3
  Rupture kidney, nontraumatic	N28.8
  Rupture kidney, traumatic	S37.0
  Rupture liver	S36.1
  Rupture of stomach	S36.3
  Rupture spleen, nontraumatic	D73.5
  Rupture spleen, traumatic	S36.0
  Ruptured acute gangrenous appendicitis	K35.3
  Ruptured appendicitis	K35.3
  Ruptured cecal diverticulitis	K57.8
  Ruptured ear drum	H72.9
  Ruptured gangrenous appendicitis	K35.3
  Ruptured globe	S05.3
  Ruptured hepatoma	C22.0
  SA - sexual abuse	T74.2
  Sacralgia	M53.3
  Sacroiliitis	M46.1
  Sadism	F65.5
  Sadomasochism	F65.5
  Salicylism Abuse of	F55
  Salmonella sepsis	A02.1
  Salmonella septicaemia	A02.1
  Salmonella typhoid fever	A01.0
  Salmonellosis	A02.0
  Salpingitis	N70.9
  Salpingocele	N83.4
  Salpingoperitonitis	N70.9
  Sarcoidosis	D86.9
  Sarcoptic itch	B86
  SAS - sleep apnoea syndrome	G47.3
  Satyriasis	F52.7
  Scabies	B86
  Scalp Abrasion ats due to birth injury	na
  Scalp avulsion	S08.0
  Scalp burn	T20.0
  Scalp contusion	S00.0
  Scalp injuries due to birth trauma	na
  Scalp lacerations due to birth injury	na
  Scalp ringworm	B35.0
  Scapular region contusion	S40.0
  Scar	L90.5
  Scar contracture	L09.5
  Scatlet fever	A38
  Schistosomiasis	B65.9
  Schizoaffective disorder	F25.9
  Schizophrenia	F20.9
  Sciatic nerve injury	S74.0
  Sciatica	M54.3
  Scleredema	M34.8
  Scleroconjunctivitis	H15.0
  Scleroderma	M34.9
  Sclerokeratitis	H16.8
  Scoliosis	M41.9
  Screening arterial hypertension	Z13.6
  Screening disease or disorder, venereal	Z11.3
  Screening for cataract	Z13.5
  Screening for depression	Z13.3
  Screening for diabetes mellitus	Z13.1
  Screening for hypertension	Z13.6
  Screening for intestinal helminthiasis	Z11.6
  Screening for malnutrition	Z13.2
  Screening for mental retardation	Z13.3
  Screening for venereal disease	Z11.3
  Screening helminthiasis	Z11.6
  Screening hemorrhagic fever	Z11.5
  Screening human immunodeficiecny virus [HIV]	Z11.4
  Screening infection, intestinal	Z11.0
  Screening infection, intestinal, helminthiasis	Z11.6
  Scrofula	A18.2
  Scrofulide	A18.4
  Scrofuloderma	A18.4
  Scrofulosus lichen	A18.4
  Scrotal abscess	N49.2
  Scrotal hemorrhage	N50.1
  Scrotum Abrasion at	S30.2
  Scrotum contusion	S30.2
  Scrotum hemorrhage	N50.1
  Scrub typhus	A75.3
  Scurvy	E54
  Sea sickness	T75.3
  Seasickness	T75.3
  Sea-snake venom poisoning	T63.0
  Sebaceous cyst	L72.1
  Seborrhea	R23.8
  Seborrheic dermatitis	L21.9
  Seborrheic keratosis	L82
  Seborrheic wart	L82
  Seborrhoeic keratosis	L82
  Second degree atrioventricular block	I44.1
  Second degree perineal tear	na
  Second degree perineal tear during delivery	na
  Secondary frozen shoulder	M75.0
  Secondary glaucoma	H40.5
  Secondary hypertension	I15.9
  Secondary parkinsonism	G21.9
  Secondary recurrent spontaneous pneumothorax	J93.1
  Secondary uncontrolled glaucoma	H40.5
  Secretion excess, sputum	R09.3
  Seizures	R56.8
  Semicoma	R40.1
  Senile cataract	H25.9
  Senile deafness	H91.1
  Senile incipient cataract	H25.0
  Senile nuclear cataract	H25.1
  Senility	R54
  Sensorineural hearing loss	H90.5
  Separated pubic symphysis	na
  Sepsis	A41.9
  Septic arthritis	M00.9
  Septic shock	R57.2
  Septicemia	A41.9
  Sequelae of complications of surgical and medical care	T98.3
  Sequelae of injury of burn corrosion and frostbite	T95.9
  Sequelae of injury of head	T90.9
  Sequelae of injury of lower limb	T93.9
  Sequelae of injury of multiple body region	T94.0
  Sequelae of injury of neck and trunk	T91.9
  Sequelae of injury of upper limb	T92.9
  Sequelae of leprosy	B92
  Sequelae of poisoning by drugs, medicaments and biological substances	T96
  Sequelae of poliomyelitis	B91
  Sequelae of toxic effects of substances chiefly nonmedicinal as to source	T97
  Seropositive rheumatoid arthritis	M05.9
  Seven-day fever, dengue	A97.9
  Severe Dengue	A97.2
  Severe Dengue fever	A97.2
  Severe Dengue haemorrhagic fever	A97.2
  Severe pre-eclampsia	na
  Severe protein-energy malnutrition	E43
  Sex abuse	T74.2
  Sex counselling	Z70.9
  Sexual abuse	T74.2
  Sexual transmitted disease, contact	Z20.2
  Sexual transmitted disease, exposure	Z20.2
  Sexuality	F65.9
  Shaking all over	R25.8
  Shigellosis	A03.9
  Shingles	B02.9
  Shock from electric current	T75.4
  Short of sleep	G47.0
  Short stature	E34.3
  Shortsightedness	H52.1
  Shoulder burn	T22.0
  Shoulder contusion	S40.0
  Shoulder dislocation	S43.0
  Shoulder injury	S49.9
  Shoulder joint dislocation	S43.0
  Shoulder lesion	M75.9
  Shutdown renal	N19
  Sialadenitis	K11.2
  Sialidosis	E77.1
  Sialoadenopathy	K11.9
  Sialodochitis	K11.2
  Sialodocholithiasis	K11.5
  Sialolithiasis	K11.5
  Sialorrhea	K11.7
  Sialosis	K11.7
  Sick	R69
  Sick sinus syndrome	I49.5
  Sickness	R69
  Sigmoiditis	A09.9
  Silicosis	J62.8
  Silicotuberculosis	J65
  Simple constipation	K59.0
  Simple goiter	E04.0
  Simple nontoxic goiter	E04.0
  Simple obesity NOS	E66.9
  Singapore hemorrhagic fever	A97.0
  Single live birth	na
  Single liveborn	na
  Single spontaneous delivery	na
  Single stillbirth	na
  Single vessel disease	I25.1
  Singleton, born in hospital	na
  Singleton, born outside hospital	na
  Sinus bradycardia	R00.1
  Sinusitis	J32.9
  Sixth disease	B08.2
  Skin callus	L84
  Skin examination	Z01.5
  Skin necrosis	R02
  Skin tag	L91.8
  Skin tuberculosis	A18.4
  SLE - systemic lupus erythematosus	M32.9
  Sleep apnea	G47.3
  Sleep apnoea	G47.3
  Sleep apnoea syndrome	G47.3
  Sleep apnoea, unspecified	G47.3
  Sleep disturbance	G47.9
  Sleep walking	F51.3
  Sleep walking disorder	F51.3
  Sleeping sickness	B56.9
  Sleeplessness	G47.0
  Sleepwalking	F51.3
  Sleepwalking disorder	F51.3
  Sloughing	R02
  Small bowel adhesion	K56.6
  Small bowel obstruction	K56.6
  Small bowel obstruction from adhesion	K56.5
  Small bowel perforate, nontraumatic	K63.
  Small kidney	N27.9
  Smallpox	B03
  Snake bite, venomous	T63.0
  Sneeze	R06.7
  Sneezing	R06.7
  Snoring	R06.5
  Social deprivation	Z60.4
  Social exclusion	Z60.4
  Social isolation	Z60.4
  Social migrant	Z59.0
  Social rejection	Z60.4
  Soft chancre - chancroid	A57
  Soft tissue disorder	M79.9
  Somatization	F45.9
  Somnambulism	F51.3
  Somnolence	R40.0
  Sore throat	J02.9
  Sore throat symptom	R07.0
  Southeast asia hemorrhagic fever	A97.0
  Sparganosis	B70.1
  Spasmodic croup	J38.5
  Spastic cerebral palsy	G80.0
  Special screening examination for neoplasm of cervix	Z12.4
  Spermatocele	N43.4
  Spermatocystitis	N49.0
  Spermatocytoma	C62.9
  Spermatorrhea	N50.8
  Sphenoiditis	J32.3
  Spherocytosis	D58.0
  Spina bifida	Q05.9
  Spinal cord abscess	G06.1
  Spinal muscular atrophy	G12.9
  Spinal osterochondrosis	M42.9
  Spinal stenosis	M48.0
  Splenic rupture nontraumatic	D73.5
  Splinter of anterior abdomen	S30.1
  Splinter of anterior chest	S20.3
  Splinter of neck	S10.8
  Splinter of scalp	S00.0
  Spondylarthrosis	M47.9
  Spondylitis	M46.9
  Spondyloarthrosis	M47.9
  Spondylolisthesis	M43.1
  Spondylolysis	M43.0
  Spondylopathy	M48.9
  Spondylosis	M47.9
  Spontaneous abortion	O03.9
  Spontaneous bacterial peritonitis	K65.0
  Spontaneous breech delivery	na
  Spontaneous delivery	na
  Spontaneous hypoglycemia	E16.2
  Spontaneous pneumothorax	J93.1
  Sporotrichosis	B42.9
  Spotted fever	A77.9
  Sprain (strain) ankle	S93.4
  Sprain (strain) finger	S63.6
  Sprain (strain) phalanx, fingers	S63.6
  Sprain and strain of elbow	S53.4
  Sprain and strain of knee	S83.6
  Sprain and strain of wrist	S63.5
  Sprain of ankle	S93.4
  Sprain of big toe	S93.5
  Sprain of finger	S63.6
  Sprain of first toe	S93.5
  Sprain of great toe	S93.5
  Sprain of toe	S93.5
  Squint	H50.9
  St elevate myocardial infarction	I21.9
  Stab wound abdomen	S31.8
  Stab wound at back	S21.2
  Stab wound at neck	S11.9
  Stable diabetes mellitus	E11.9
  Staghorn stone	N20.0
  Staphylococcal scaled skin syndrome	L00
  Starvation	T73.0
  Status asthmatic	J46
  Status asthmaticus	J46
  Status epilepticus	G41.9
  Status of nephrostomy	Z93.6
  Status of ureterostomy	Z93.6
  Status of urethrostomy	Z93.6
  Steatorrhea	K90.4
  Steatosis	E88.8
  Sterilization, admission for	Z30.2
  Sternoclavicular joint dislocation	S43.2
  Steroids abuse	F55
  Stevens johnson syndrome	L51.1
  Stich abscess	T81.4
  Stiff joint	M25.6
  Stillbirth	na
  Stone in kidney	N20.0
  Stone in the ureter	N20.1
  Strabismus	H50.9
  Streptococcal pneumonia	J13
  Streptococcal sepsis	A40.9
  Stress	Z73.3
  Stress incontinence	N39.3
  Stridor	R06.1
  Stroke	I64
  Stroke not known if ischaemic or haemorrhagic	I64
  Stroke syndrome	I64
  Stroke, not specified as haemorrhage or infarction	I64
  Strongyloidiasis	B78.9
  Struck by lightning	T75.0
  Stupor	R40.1
  Stuttering	F98.5
  Sty	H00.0
  Sty, external	H00.0
  Stye	H00.0
  Stye of eyelid	H00.0
  Subacromian impingement syndrome shoulder	M75.4
  Subacute cholecystitis	K81.8
  Subarachnoid haemorrhage	I60.9
  Subareolar Abscess at gestational or puerperal	na
  Subclinical hypothyroidism	E02
  Subconjunctival bleed	H11.3
  Subconjunctival contusion	S05.0
  Subconjunctival haemorrhage	H11.3
  Subcutaneous nodules (localized)(superficial) at abdominal wall	R22.2
  Subcutaneous nodules (localized)(superficial) at ankle	R22.4
  Subcutaneous nodules (localized)(superficial) at arm	R22.3
  Subcutaneous nodules (localized)(superficial) at back	R22.2
  Subcutaneous nodules (localized)(superficial) at breast	R22.2
  Subcutaneous nodules (localized)(superficial) at buttock	R22.2
  Subcutaneous nodules (localized)(superficial) at chest wall	R22.2
  Subcutaneous nodules (localized)(superficial) at ear	R22.0
  Subcutaneous nodules (localized)(superficial) at elbow	R22.3
  Subcutaneous nodules (localized)(superficial) at eyelid	R22.0
  Subcutaneous nodules (localized)(superficial) at face	R22.0
  Subcutaneous nodules (localized)(superficial) at finger	R22.3
  Subcutaneous nodules (localized)(superficial) at foot	R22.4
  Subcutaneous nodules (localized)(superficial) at forearm	R22.3
  Subcutaneous nodules (localized)(superficial) at hand	R22.3
  Subcutaneous nodules (localized)(superficial) at hip	R22.4
  Subcutaneous nodules (localized)(superficial) at knee	R22.4
  Subcutaneous nodules (localized)(superficial) at leg	R22.4
  Subcutaneous nodules (localized)(superficial) at neck	R22.1
  Subcutaneous nodules (localized)(superficial) at nose	R22.0
  Subcutaneous nodules (localized)(superficial) at scalp	R22.0
  Subcutaneous nodules (localized)(superficial) at shoulder	R22.3
  Subcutaneous nodules (localized)(superficial) at thigh	R22.4
  Subcutaneous nodules (localized)(superficial) at toe	R22.4
  Subcutaneous nodules (localized)(superficial) at wrist	R22.3
  Subdural haemorrhage	I62.0
  Subdural haemorrhage traumatic	S06.5
  Subgaleal hematoma	S00.0
  Submandibular mass	R22.0
  Submental mass	R22.0
  Submersion	T75.1
  Submucous myoma of uterus	D25.0
  Submucous myoma uteri	D25.0
  Subsequent myocardial infarction	I22.9
  Subserosal myoma uteri	D25.2
  Subungual haematoma	L60.8
  Subungual haemorrhage	L60.8
  Subungual injury toes	S90.2
  Subungual injury, superficial, toe(s)	S90.2
  Sudden death	R96.0
  Sunburn	L55.9
  Sunconjunctival hemorrhage	H11.3
  Sunconjunctival hemorrhage, traumatic	S05.0
  Sunstroke	T67.0
  Superficial bacterial folliculitis	L73.9
  Superficial bite of scalp	S00.0
  Superficial bruising of ankle	S90.0
  Superficial folliculitis	L73.9
  Superficial folliculitis associated with normal skin flora	L73.9
  Superficial foreign body of anterior abdomen	S30.1
  Superficial foreign body of anterior chest	S20.3
  Superficial foreign body of neck	S10.0
  Superficial foreign body of scalp	S00.0
  Superficial frostbite	T33.9
  Superficial subcutaneous lipoma at abdominal wall	D17.1
  Superficial subcutaneous lipoma at ankle	D17.2
  Superficial subcutaneous lipoma at arm	D17.2
  Superficial subcutaneous lipoma at back	D17.1
  Superficial subcutaneous lipoma at breast	D17.1
  Superficial subcutaneous lipoma at buttock	D17.1
  Superficial subcutaneous lipoma at chest wall	D17.1
  Superficial subcutaneous lipoma at ear	D17.0
  Superficial subcutaneous lipoma at elbow	D17.2
  Superficial subcutaneous lipoma at eyelid	D17.0
  Superficial subcutaneous lipoma at face	D17.0
  Superficial subcutaneous lipoma at finger	D17.2
  Superficial subcutaneous lipoma at foot	D17.2
  Superficial subcutaneous lipoma at forearm	D17.2
  Superficial subcutaneous lipoma at hand	D17.2
  Superficial subcutaneous lipoma at hip	D17.2
  Superficial subcutaneous lipoma at knee	D17.2
  Superficial subcutaneous lipoma at leg	D17.2
  Superficial subcutaneous lipoma at neck	D17.0
  Superficial subcutaneous lipoma at nose	D17.0
  Superficial subcutaneous lipoma at scalp	D17.0
  Superficial subcutaneous lipoma at shoulder	D17.2
  Superficial subcutaneous lipoma at thigh	D17.2
  Superficial subcutaneous lipoma at toe	D17.2
  Superficial subcutaneous lipoma at wrist	D17.2
  Supervision of elderly primigravida	na
  Supervision of high-risk pregnancy	na
  Supervision of lactation	na
  Supervision of normal first pregnancy	na
  Supervision of normal pregnancy	na
  Supervision of pregnancy with grand multiparity	na
  Supervision of very young primigravida	na
  Suppurative appendicitis	K35.8
  Supraventricular tachycardia	I47.1
  Surgical follow-up care	Z48.9
  Surgical keloid wound of skin	L91.0
  Surgical scar of skin	L91.0
  Suture removal	Z48.0
  Sutured wound infection	T81.4
  Swan neck deformity	M20.0
  Sweat gland disorder	L74.9
  Swelling of thyroid gland	E04.9
  Sympatheticotonia	G90.8
  Sympathicoblastoma	C74.9
  Sympathicogonioma	C74.9
  Sympathoblastoma	C74.9
  Sympathogonioma	C74.9
  Symptomatic gall stone	K80.2
  Symptomatic gallstone	K80.2
  Symptomatic hypoglycemia	E16.2
  Symptomatic hyponatremia	E87.1
  Syncope	R55
  Syncope and collapse	R55
  Syndactylism	Q70.9
  Syndactyly	Q70.9
  Syndrome of inappropriate secretion of antidiuretic hormone	E22.2
  Syndrome of infant of mother with gestational diabetes	na
  Synovitis	M65.9
  Syphilis	A53.9
  Syphilis contact	Z20.2
  Syphilis exposure	Z20.2
  Syphilis penis	A51.0
  Syphilitic chancre	A51.0
  Syphilitic chancre NOS	A51.0
  Syphilitic chancre of penis	A51.0
  Syringomyelia	G95.0
  Syringomyelitis	G04.9
  Syringomyelocele	Q05.9
  Syringopontia	G95.0
  System lupus erythematosus	M32.9
  Systemic lupus erythematosus	M32.9
  Systemic sclerosis	M34.9
  TAB immunization	Z23.1
  Tachycardia	R00.0
  Tachypnea	R06.8
  Tachypnoea	R06.8
  Taeniasis	B68.9
  Tapeworm infection	B71.9
  Teeth decayed	K02.9
  Telangiectasia	I78.1
  Temple burn	T20.0
  Temporal burn	T20.0
  Tendinitis	M77.9
  Tendosynovitis	M65.9
  Tenosynovitis	M65.9
  Tension pneumothorax	J93.0
  Tension pneumothorax, traumatic	S27.0
  Tension-type headache	G44.2
  Testicular dysfunction	E29.9
  Tetanus	A35
  Tetanus inoculation	Z23.5
  Tetanus neonatorum	na
  Tetanus omphalitis	A33
  Tetanus with abortion or ectopic gestation	na
  Tetralogy of fallot	Q21.3
  Thalassaemia (minor)(mixed)(with other haemoglobinopathy)	D56.9
  Thalassaemia haemoglobin e trait	D56.9
  Thalassaemias	D56.9
  Thalassemia	D56.9
  Thalassemia anemia	D56.9
  Thalassemia disorder, hemoglobin	D56.9
  Thalassemia hemoglobinopathy (with thalassemia)	D56.9
  Thalassemia syndrome	D56.9
  Thalassemia trait	D56.3
  Thalassemias	D56.9
  Thelitis puerperal	na
  Thigh burn	T24.0
  Thigh contusion	S70.1
  Thigh crushed	S77.1
  Thigh injury	S79.9
  Third degree perineal laceration	na
  Third degree perineal tear during delivery	na
  Third stage haemorrhage	na
  Thoracic burn	T21.0
  Thorax burn	T21.0
  Threatened abortion	O20.0
  Throat discomfort	R07.0
  Throat hemorrhage	R04.1
  Throat pain	R07.0
  Thromboangiitis obliterans	I73.1
  Thromboarteritis	I77.6
  Thromboasthenia	D69.1
  Thrombocythemia	D47.3
  Thrombocytopathy	D69.1
  Thrombocytopenia	D69.6
  Thrombocytosis	D47.3
  Thromboembolism	I74.9
  Thrombopathy	D69.1
  Thrombopenia	D69.6
  Thrombophlebitis	I80.9
  Thrombophlebitis pregnancy	na
  Thrombosed external haemorhoids	K64.8
  Thrush	B37.9
  Thumb dislocation	S63.1
  Thumb fracture	S62.5
  Thumb traumatic amputation	S68.0
  Thymoma	D15.0
  Thymus disease	E32.9
  Thyroglossal duct cyst	Q89.2
  Thyroid (cystic) nodule NOS	E04.1
  Thyroid abscess	E06.0
  Thyroid colloid nodule	E04.1
  Thyroid crisis	E05.5
  Thyroid cyst	E04.1
  Thyroid deficiency	E03.9
  Thyroid disorder	E07.9
  Thyroid enlarged	E04.9
  Thyroid enlargement	E04.9
  Thyroid gland abscess	E06.0
  Thyroid gland cyst	E04.1
  Thyroid gland enlargement	E04.9
  Thyroid gland hyperplasia	E04.9
  Thyroid gland hypertrophy	E04.9
  Thyroid gland insufficiency	E03.9
  Thyroid gland nodule	E04.1
  Thyroid glandular cyst	E04.1
  Thyroid glandular enlargement	E04.9
  Thyroid glandular hyperplasia	E04.9
  Thyroid glandular hypertrophy	E04.9
  Thyroid glandular insufficiency	E03.9
  Thyroid glandular nodule	E04.1
  Thyroid goiter	E04.9
  Thyroid hyperplasia	E04.9
  Thyroid hypertrophy	E04.9
  Thyroid insufficiency	E03.9
  Thyroid node	E04.1
  Thyroid node, toxic or with hyperthyroidism	E05.2
  Thyroid nodular	E04.1
  Thyroid nodule	E04.1
  Thyroid nodule (nontoxic)	E04.1
  Thyroid nodule, toxic or with hyperthyroidism	E05.2
  Thyroid suppuration	E06.0
  Thyroiditis	E06.9
  Thyroiditis pyogenic	E06.0
  Thyroiditis suppurative	E06.0
  Thyromegaly	E04.9
  Thyrotoxicosis	E05.9
  Thyrotoxicosis [hyperthyroidism]	E05.9
  Thyrotoxicosis due to uninodular goiter	E05.1
  Thyrotoxicosis due to uninodular goitre	E05.1
  Thyrotoxicosis goiter	E05.0
  Thyrotoxicosis goiter, adenomatous	E05.2
  Thyrotoxicosis goiter, nodular	E05.2
  Thyrotoxicosis single thyroid nodule	E05.1
  Thyrotoxicosis with diffuse goiter	E05.0
  Thyrotoxicosis with diffuse goitre	E05.0
  Thyrotoxicosis with goiter	E05.0
  Thyrotoxicosis with toxic multinodular goitre	E05.2
  Thyrotoxicosis with toxic single thyroid nodule	E05.1
  Thyrotoxicosis with toxic uninodular goitre	E05.1
  Tick-borne typhus	A77.9
  Tick-borne viral encephalitis	A84.9
  Tinea	B35.9
  Tinea barbae	B35.0
  Tinea capitis	B35.0
  Tinea corporis	B35.4
  Tinea cruris	B35.6
  Tinea faciei	B35.8
  Tinea imbricata	B35.5
  Tinea incognita	B35.8
  Tinea manus	B35.2
  Tinea manuum	B35.2
  Tinea of fingernail	B35.1
  Tinea of nail	B35.1
  Tinea of perianal region	B35.8
  Tinea of toenail	B35.1
  Tinea pedis	B35.3
  Tinea unguium	B35.1
  Tinea unguium of fingers	B35.1
  Tinea unguium of toes	B35.1
  Tinea versicolor	B36.0
  Tobacco usage	Z72.0
  Tobacco use	Z72.0
  Toe (toes) sprain (strain)	S93.5
  Toe crushing	S97.1
  Toe dislocation	S93.1
  Toe fracture	S92.5
  Tolosa hunt syndrome	G44.8
  Tongue tie	Q38.1
  Tonsillitis	J03.9
  Tonsillopharyngitis	J03.9
  Tooth caries	K02.9
  Tooth decay	K02.9
  Tooth decayed	K02.9
  Tooth fracture	S02.5
  Toothache	K08.8
  Torsion of testis	N44
  Total retinal detachment	H33.2
  Total rhegmatogenous retinal detachment	H33.0
  Toxic adenomatous goiter	E05.2
  Toxic adenomatous goitre	E05.2
  Toxic cholangitis	K83.0
  Toxic diffuse goiter	E05.0
  Toxic diffuse goiter with exophthalmos	E05.0
  Toxic diffuse goitre	E05.0
  Toxic diffuse goitre with exophthalmos	E05.0
  Toxic effect of bee sting	T63.4
  Toxic effect of spider bite	T63.3
  Toxic encephaopathy	G92
  Toxic goiter	E05.0
  Toxic goitre	E05.0
  Toxic liver disease	K71.9
  Toxic multinodular goiter	E05.2
  Toxic nodular goiter	E05.2
  Toxic nodular goiter nos	E05.2
  Toxic nodular goiter, unspecified type	E05.2
  Toxic nodular goitre	E05.2
  Toxic primary thyroid hyperplasia	E05.0
  Toxic thyroid nodule	E05.1
  Toxic uninodular goiter	E05.1
  Toxic uninodular goitre	E05.1
  Toxoplasmosis	B58.9
  Tracheitis	J04.1
  Tracheobronchitis	J40
  Tracheobronchopneumonitis	J18.0
  Tracheomalacia	J39.8
  Tracheopharyngitis	J06.8
  Tracheostenosis	J39.8
  Tracheostomy status	Z93.0
  Trachoma	A71.9
  Traction retinal detachment	H33.2
  Tractional retinal detachment	H33.2
  Train sickness	T75.3
  Transfusion reaction	T80.9
  Transient cerebral ischaemic attack	G45.9
  Transient ischemic attack	G45.9
  Transposition of great artery	Q20.3
  Transverse myelitis	G37.3
  Traumatic amputation of arm	T11.6
  Traumatic amputation of foot at ankle	S98.0
  Traumatic amputation of forearm	S58.9
  Traumatic amputation of hand	S68.9
  Traumatic amputation of hip or thigh, unspecified	S78.9
  Traumatic amputation of leg	T13.6
  Traumatic amputation of lower leg	S88.9
  Traumatic amputation of nose	S08.8
  Traumatic amputation of other single finger	S68.1
  Traumatic amputation of penis	S38.2
  Traumatic amputation of scrotum	S38.2
  Traumatic amputation of thumb	S68.0
  Traumatic amputation of toe	S98.1
  Traumatic amputation of vulva	S38.2
  Traumatic amputation of wrist	S68.4
  Traumatic amputation, ear	S08.1
  Traumatic amputation, labium	S38.2
  Traumatic amputation, penis	S38.2
  Traumatic amputation, scrotum	S38.2
  Traumatic amputation, testis	S38.2
  Traumatic cataract	H26.1
  Traumatic edema of eyelid	S00.1
  Traumatic edema of lower eyelid	S00.1
  Traumatic edema of upper eyelid	S00.1
  Traumatic herniated nucleus pulposus	S33.0
  Traumatic hyphaema	S05.1
  Traumatic macular hole	S05.8
  Traumatic shock	T79.4
  Traumatic subdural haemorrhage	S06.5
  Traumatic subdural hematoma	S06.5
  Travel sickness	T75.3
  Trench fever	A79.0
  Trichiasis	H02.0
  Trichinellosis	B75
  Trichobezoar	T18.9
  Trichomoniasis	A59.9
  Trichosis axillaris	A48.8
  Trichotillomania	F63.3
  Trichuriasis	B79
  Tricompartment osteoarthritis	M19.8
  Trigeminal neuralgia	G50.0
  Trigger finger	M65.3
  Trigger thumb	M65.3
  Trigonitis	N30.3
  Triple vessels disease	I25.1
  Triplet pregnancy	na
  Trismus neonatorum	na
  Truncus arteriosus	Q20.0
  Trunk burn	T21.0
  Trypanosomiasis	B56.9
  Tubal abortion	O00.1
  Tubal pregnancy	O00.1
  Tuberculoma	A16.9
  Tuberculosis	A16.9
  Tuberculosis arthitis	A18.0
  Tuberculosis contact	Z20.1
  Tuberculosis exposure	Z20.1
  Tuberculosis of bone	A18.0
  Tuberculosis of lung (without mention of bacteriological or histological confirmation)	A16.2
  Tuberculosis of lung, bacteriological and histological examination not done	A16.1
  Tuberculosis of lung, bacteriologically and histologically negative	A16.0
  Tuberculosis of lung, without mention of bacteriological or histological confirmation	A16.2
  Tuberculosis orchitis	A18.1
  Tuberculosis pulmonary, without mention of bacteriological or histological confirmation	A16.2
  Tuberculosis verrucosa cutis	A18.4
  Tuberculous bone	A18.0
  Tuberculous chancre	A18.4
  Tularemia	A21.9
  Tumor metastasis	C79.9
  Tumor, metastatic	C79.9
  Turner syndrome	Q96.9
  Twin pregnancy	na
  Twin, born in hospital	na
  Twin, born outside hospital	na
  Twins, both liveborn	na
  Twins, both stillborn	na
  Twins, one liveborn and one stillborn	na
  Twisted ovarian cyst	N83.5
  Tympanic membrane perforation	H72.9
  Tympanic membrane rupture	H72.9
  Tympanic membrane rupture, traumatic	S09.2
  Type 1 diabetes mellitus	E10.9
  Type 1 diabetes mellitus, unspecified	E10.9
  Type 2 diabetes mellitus	E11.9
  Type 2 diabetes mellitus with diabetic foot	E11.5
  Type 2 diabetes mellitus with diabetic foot arthropathy	E11.5
  Type 2 diabetes mellitus with diabetic foot gangrene	E11.5
  Type 2 diabetes mellitus with diabetic foot ulcer	E11.5
  Type 2 diabetes mellitus with gangrene	E11.5
  Type 2 diabetes mellitus with ulcer	E11.5
  Type 2 diabetes mellitus without complications	E11.9
  Type II diabetes	E11.9
  Type II diabetic	E11.9
  Type II obese diabetic	E11.9
  Typhoid	A01.0
  Typhoid any site	A01.0
  Typhoid carrier	Z22.0
  Typhoid fever	A01.0
  Typhoid fever any site	A01.0
  Typhoid infection	A01.0
  Typhoid infection any site	A01.0
  Typhoid ulcer	A01.0
  Typhus fever	A75.9
  Ulcer of lower limb	L97
  Ulcer of mouth	K12.1
  Ulcer of skin, head	L98.4
  Ulcer of skin, neck	L98.4
  Ulcer of skin, trunk	L98.4
  Ulcer of skin, upper limb	L98.4
  Ulcer(ation) of oral mucosa	K12.1
  Ulcer, buccal	K12.1
  Ulcer, palate	K12.1
  Ulcerative colitis	K51.9
  Ulcus molle	A57
  Umbilical hernia	K42.9
  Umbilical infection of newborn	na
  Umbilical sepsis, tetanus	na
  Umbilical stump infection of the newborn	na
  Unattended death	R98
  Unclassified tumour, malignant	C80.9
  Uncomplicated labour or delivery with livebirth	na
  Uncomplicated labour or delivery with stillbirth	na
  Unconscious	R40.2
  Unconscious(ness)	R40.2
  Unconsciousness	R40.2
  Underachievement	Z55.3
  Undernourishment	E46
  Undernutrition	E46
  Underweight	R62.8
  Undescended testicle	Q53.9
  Undescended testis	Q53.9
  Unemployment	Z56.0
  Unhappiness	R45.2
  Unilateral cleft lip	Q36.9
  Uninodular goiter	E04.1
  Uninodular goiter, toxic or with hyperthyroidism	E05.1
  Uninodular goitre	E04.1
  Unprogress of labour	na
  Unspecified abortion	na
  Unspecified lump in breast	N63
  Unspecified nontoxic nodular goiter	E04.9
  Unstable angina	I20.0
  Unstable lie	na
  Unwanted pregnancy	Z64.0
  Upper arm fracture	S42.3
  Upper gastrointestinal bleeding	K92.2
  Upper gastrointestinal haemorrhage	K92.2
  Upper limb burn	T22.0
  Upper limb paralysis	G83.2
  Upper respiratory infection	J06.9
  Urachus, patent or persistent	Q64.4
  Uremia	N19
  Uremic encephalopathy	G93.8
  Ureter calculi	N20.1
  Ureteric calculi	N20.1
  Ureterocele	N28.8
  Ureterolith	N20.1
  Urethral condyloma	A63.0
  Urethral discharge	R36
  Urethral disorder	N36.9
  Urethral prolapse	N36.3
  Urethral stricture	N35.9
  Urethralgia	R39.8
  Urethritis	N34.2
  Urethrocele, female	N81.0
  Urethrocele, male	N36.3
  Urethrolithiasis	N21.1
  Uricemia	E79.0
  Urinary incontinence	R32
  Urinary retension	R33
  Urinary tract infection	N39.0
  Urinary tract infection, site not specified	N39.0
  Urinary tract infection, unspecified	N39.0
  Urination pain	R30.9
  Uroarthritis	M02.3
  Urocystitis	N30.9
  Urolithiasis	N20.9
  Uronephrosis	N13.3
  Urticaria	L50.9
  Uterine atony	na
  Uterine myoma	D25.9
  Uterine procidentia	N81.3
  Uterine prolapsed	N81.3
  Uterus prolapse, complete	N81.3
  Uveitis	H20.9
  Uveitis glaucoma	H40.4
  Uveokeratitis	H20.9
  Uveoparotitis	D86.8
  Uvulitis	K12.2
  Vaccination prophylactic, arthropod-borne viral encephalitis	Z24.1
  Vaccination prophylactic, cholera	Z23.0
  Vaccination prophylactic, cholera, with typhoid-paratyphoid	Z27.0
  Vaccination prophylactic, diphtheria	Z23.6
  Vaccination prophylactic, diphtheria-tetanus-pertussis combined	Z27.1
  Vaccination prophylactic, diphtheria-tetanus-pertussis combined, with poliomyelitis	Z27.3
  Vaccination prophylactic, diphtheria-tetanus-pertussis combined, with typhoid-paratyphoid	Z27.2
  Vaccination prophylactic, influenza	Z25.1
  Vaccination prophylactic, leishmaniasis	Z26.0
  Vaccination prophylactic, measles	Z24.4
  Vaccination prophylactic, measles-mumps-rubella	Z27.4
  Vaccination prophylactic, mumps	Z25.0
  Vaccination prophylactic, plague	Z23.3
  Vaccination prophylactic, poliomyelitis	Z24.0
  Vaccination prophylactic, rabies	Z24.2
  Vaccination prophylactic, rubella	Z24.5
  Vaccination prophylactic, tetanus toxoid (alone)	Z23.5
  Vaccination prophylactic, tuberculosis	Z23.2
  Vaccination prophylactic, tularemia	Z23.4
  Vaccination prophylactic, typhoid-paratyphoid	Z23.1
  Vaccination prophylactic, viral hepatitis	Z24.6
  Vaccination prophylactic, yellow fever	Z24.3
  Vacuum extraction delivery	na
  Vagina bleeding	N93.9
  Vagina hemorrhage	N93.9
  Vaginal bleeding	N93.9
  Vaginal hemorrhage	N93.9
  Vaginal thrush	B37.3
  Vaginalitis	N76.0
  Vaginismus	N94.2
  Vaginitis	N76.0
  Vagovagal hypotension	I95.8
  Valvulitis	I38
  Variceal bleeding	I85.0
  Varicella	B01.9
  Varicella infection	B01.9
  Varicella without complication	B01.9
  Varicella, unspecified	B01.9
  Varicocele	I86.1
  Varicose ulcer	I83.0
  Varicose veins	I83.9
  Varicose veins of lower extremity in pregnancy	na
  Vasa previa	na
  Vascular dementia	F01.9
  Vascular headache	G44.1
  Vasculitis limited to skin	L95.9
  Vasovagal syncope	R55
  Venereal disease	A64
  Venereal disease contact	Z20.2
  Venereal warts	A63.0
  Venomous bite or sting, lizard	T63.1
  Venomous insect bite	T63.4
  Venous leg ulcer	I83.0
  Venous thrombosis	I82.9
  Ventricular septal defect	Q21.0
  Ventricular tachycardia	I47.2
  Verruca plana	B07
  Verruca plantaris	B07
  Verruca vulgaris	B07
  Verrucae sole of foot	B07
  Vertiginous syndrome	H81.9
  Vertigo	R42
  Vesicovaginal fistula	N82.0
  Vesiculitis	N49.0
  Vestibular neuronitis	H81.2
  Vestibulitis	H83.0
  Viral acute gastroenteritis	A09.0
  Viral conjunctivitis	B30.9
  Viral croup	J05.0
  Viral enanthem	B09
  Viral encephalitis	A86
  Viral exanthem	B09
  Viral gastritis	K29.7
  Viral gastroenteritis	A09.0
  Viral hepatitis	B19.9
  Viral hepatitis carrier	Z22.8
  Viral hepatitis contact	Z20.5
  Viral infection	B34.9
  Viral meningitis	A87.9
  Viral pharyngotonsillitis	J03.9
  Viral pneumonia	J12.9
  Viral warts	B07
  Viremia	B34.9
  Virilism	E25.9
  Virilization	E25.9
  Virus carrier of hepatitis virus	Z22.8
  Virus hepatitis, carrier	Z22.8
  Virus hepatitis, contact	Z20.5
  Visible peristalsis	R19.2
  Vision test	Z01.0
  Vitamin A deficiency	E50.9
  Vitamin B deficiency	E53.9
  Vitamin	B12
  Vitamin C deficiency	E54
  Vitiligo	L80
  Vitreous hemorrhage	H43.1
  Vocal nodule	J38.2
  Voice loss	R49.1
  Volume depletion	E86
  Volume depletion, extracellular fluid	E86
  Volume depletion, unspecified	E86
  Volume overload	E87.7
  Volvulus	K56.2
  Vomiting	R11
  Vomiting blood	K92.0
  Vomiting in newborn	na
  Vomiting of newborn	P92.0
  Vomiting of or complicating pregnancy	O21.9
  Voyeurism	F65.3
  Vulva carbuncle	N76.4
  Vulval thrush	B37.3
  Vulvitis	N76.2
  Vulvovaginal gland abscess	N75.1
  Vulvovaginal thrush.	B37.3
  Vulvovaginitis	N76.0
  Vulvovaginitis acute	N76.0
  Wart	B07
  Warts	B07
  Water deprivation	T73.1
  Water pollution	Z58.2
  Water pollution exposure	Z58.2
  Water warts	B08.2
  Wax in ear	H61.2
  Weak pulse	R09.8
  Weight gain	R63.5
  Welfare support inadequate	Z59.7
  Wheelchair dependence	Z99.3
  Wheeze	R06.2
  Wheezing	R06.2
  Wheezing associated respiratory illness	J98.8
  Whiplash injury	S13.4
  Whipworm	B79
  Whitlow	L03.0
  Whooping cough	A37.9
  Widespread metastatic malignant neoplastic disease	C79.9
  Wilms' tumor	C64
  Withdrawal syndrome	F19.3
  Worries	R45.2
  Wound infection	T79.3
  Wound infection, post operative	T81.4
  Wound infection, post traumatic	T79.3
  Wrist - burn	T23.0
  Wrist deformity	M21.9
  Wuchereria	B74.0
  Wuchereriasis	B74.0
  Xanthelasma	H02.6
  Xanthinuria	E79.8
  Xanthogranuloma	D76.3
  Xanthomas	E75.5
  Xanthosis	R23.8
  Xenophobia	F40.1
  Xeroderma	L85.0
  Xerophthalmia	E50.7
  Xerostomia	K11.7
  Yaws	A66.9
  Yellow fever	A95.9
  Yersiniosis, extraintestinal	A28.2
  Yersiniosis, intestinal	A04.6
  Zika virus infection	A92.8
  Zona zoster	B02.9
  Zoophobia	F40.2
  Zoster	B02.9
  Zygomycosis	B46.9
`).map(buildDiagnosis);
