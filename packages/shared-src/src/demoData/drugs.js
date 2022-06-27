import { splitIds } from './utilities';

export const DRUGS = splitIds(`
  Asparaginase 10,000 iu in vial powder for injection
  Bendamustine 180mg/2ml injection
  Bendamustine 45mg/0.5ml injection
  Measles vaccine
  Anti-rabies immunoglobulin 150iu/ml in vial injection
  Anti-d immunoglobulin 250mcg injection
  Abacavir (abc) (sulfate) 100mg/5ml oral liquid
  Abacavir (abc) (sulfate) 300mg tablet
  Alcohol based hand rub (ethanol) solution 80% volume/volume
  Aciclovir 3% ointment
  Acetylcysteine 10 % oral liquid
  Acetylcysteine 20 % oral liquid
  Acetylcysteine 200mg/ml in 10ml ampoule, injection
  Acetylsalicylic acid 50mg suppository
  Acetylsalicylic acid 100mg suppository
  Acetylsalicylic acid 100mg tablet
  Acetylsalicylic acid 150mg suppository
  Acetylsalicylic acid 300mg tablet
  Acetylsalicylic acid 500mg tablet
  Aciclovir 200mg/5ml oral liquid
  Aciclovir 200mg tablet
  Aciclovir (sodium) 250mg powder for injection
  Amodiaquine (hydrochloride) 153mg tablet
  Amodiaquine (hydrochloride) 200mg tablet
  Albendazole 400mg tablet (chewable)
  Amiodarone(hydrochloride) 50mg/ml in 2ml ampoule
  Amiodarone(hydrochloride)100mg tablet
  Amidotrizoate (iodine meglumine) 140mg/ml in 20ml ampoule injection
  Amidotrizoate (iodine sodium) 140mg/ml in 20ml ampoule injection
  Amidotrizoate (iodinemeglumine) 280mg/ml in 20ml ampoule injection
  Amidotrizoate (iodine sodium) 280mg/ml in 20ml ampoule injection
  Amidotrizoate (iodine meglumine) 420mg/ml in 20ml ampoule injection
  Amidotrizoate (iodine sodium) 420mg/ml in 20ml ampoule injection
  Amikacin (sulfate) 1g powder for injection
  Amikacin (sulfate) 100mg powder for injection
  Amikacin (sulfate) 500mg powder for injection
  Amiloride (hydrochloride) 5mg tablet
  Artemether & lumefantrine 20mg & 120mg tablet
  Artemether & lumefantrine 20mg & 120mg tablet dispersible
  Amlodipine (maleate) 5mg tablet
  Ampicillin (sodium)1g powder for injection
  Ampicillin (sodium) 500mg powder for injection
  Amlodipine (mesylate) 5mg tablet
  Amlodipine (besylate) 5mg tablet
  Amitriptyline 10mg tablet
  Amitriptyline 25mg tablet
  Amitriptyline 75mg tablet
  Amoxicillin & clavulanic acid 125mg &31.25mg /5ml oral liquid
  Amoxicillin (trihydrate) 125mg/5ml powder for oral liquid
  Amoxicillin & clavulanic acid 250mg &62.5mg /5ml oral liquid
  Amoxicillin (trihydrate)  250mg/5ml powder for oral liquid
  Amoxicillin (trihydrate) 250mg solid oral dosage form
  Amoxicillin (trihydrate) 500mg solid oral dosage form
  Amoxicillin (trihydrate)  & clavula& 125mg tablet
  Artesunate & amodiaquine100mg & 270mg tablet
  Artesunate & amodiaquine 25mg & 67.5mg tablet
  Artesunate & amodiaquine 50mg & 135mg tablet
  Anastrozole 1mg tablet
  Allopurinol 100mg tablet
  Allopurinol 300mg tablet
  Amphotericin b (sodium deoxycholate) 50mg powder for injection
  Amphotericin b (liposomal complex) 50mg powder for injection
  Artesunate 200mg rectal dosage form
  Artesunate 50mg rectal dosage form
  Artesunate 50mg tablet
  Artesunate (anhdrous artesunic acid) 60mg with separate ampoule of 5% sodium bicarbonate solution
  All trans retinoid acid (atra) 10mg capsule
  Acetic acid 2% in alcohol, topical
  Ascorbic acid 50mg tablet
  Artesunate & mefloquine 100mg & 220mg tablet
  Artesunate & mefloquine 25mg & 55mg tablet
  Artemether 80mg.ml in 1ml ampoule
  Atenelol 5mg tablet
  Atenelol 10mg tablet
  Atenelol 1.25mg tablet
  Atenelol 2.5mg tablet
  Atropine (sulfate) 0.1% eye drops solution
  Atropine (cyclopentalate (hydrochloride)) 0.1% eye drops solution
  Atropine (homatropine (hydrobromide)) 0.1% eye drops solution
  Atropine (sulfate) 1mg/ml (1ml) injection
  Atropine (sulfate) 0.5% eye drops solution
  Atropine  (cyclopentalate (hydrochloride))  0.5% eye drops solution
  Atropine(homatropine (hydrobromide)) 0.5% eye drops solution
  Atropine (sulfate) 1% eye drops solution
  Atropine  (cyclopentalate (hydrochloride))  1% eye drops solution
  Atropine(homatropine (hydrobromide)) 1% eye drops solution
  Azathioprine  50mg tablet (scored)
  Azathioprine (sodium) 100mg powder for injection in vial
  Atracurium (besylate) 10mg/ml injection
  Anti-venom immunoglobulin injection
  Abacavir (sulfate) & lamuvidine 60mg & 30mg dispersible,scored tablet
  Acetazolamide 250mg tablet
  Azithromycin 200mg/5ml oral liquid
  Azithromycin (anhydrous) 250mg capsule
  Azithromycin (anhydrous) 500mg capsule
  Azithromycin 1.5% eye drop solution
  Atazanavir (sulfate) 100mg solid oral dosafe form mg
  Atazanavir (sulfate) 150mg solid oral dosafe form
  Atazanavir (sulfate) 300mg  solid oral dosafe form
  Barium sulfate aqueous suspension
  Bcg vaccine
  Bicalutamide 50mg tablet
  Budesonide 100mcg per dose nasal spray
  Budesonide 100mcg inhalation (aerosol)
  Budesonide 200mcg inhalation (aerosol)
  Betamethasone (valerate) 0.1% cream
  Betamethasone (valerate) 0.1% ointment
  Bedaquiline 100mg tablet
  Bisoprolol 1.25mg tablet
  Bisoprolol 5 mg tablet
  Beclometasone (dipropionate) 50mcg inhalation (aerosol)
  Beclometasone (dipropionate) 100mcg inhalation (aerosol)
  Bleomycin (sulfate) 15mg powder for injection
  Benzyl benzoate 25% lotion
  Benznidazole 12.5mg tablet
  Benznidazole 50mg tablet (scored)
  Benznidazole 100mg tablet
  Benzylpenicillin (potassium) 600mg (1 million iu) potassium
  Benzylpenicillin (sodium) 600mg (1 million iu) sodium
  Benzylpenicillin  (potassium)  3g (2.4 million iu) potassium
  Benzylpenicillin (sodium) 3g (2.4 million iu) sodium
  Biperidin (hydrochloride) 2mg talbet
  Biperidin (lactate) 5mg in 1ml ampoule
  Bupivacaine 0.5% (spinal, 4ml amp mixed with 7.5% glucose)
  Bupivacaine 0.25%
  Bupivacaine 0.50%
  Bevacizumab 25mg/ml injection
  Benzoyl peroxide 5% cream
  Benzoyl peroxide 5% lotion
  Benzathine benzylpenicillin 1.44g (2.4 million iu) /5ml vial
  Benzathine benzylpenicillin 900mg (1.2 million iu) /5ml vial
  Calcium folinate 3mg/ml in 10 ml amploule injection
  Calcium folinate 15mg tablet
  Caffeine citrate 20mg/ml (equivalent to 10mg caffeine base/ml) injection
  Caffeine citrate 20mg/ml (equivalent to 10mg caffeine base/ml) oral liquid
  Calcium gluconate 100mg/ml, 10 ml ampoule, injection
  Calcium (elemental) 500mg tablet
  Capecitabine 150mg tablet
  Capecitabine 500mg tablet
  Chlorine base compound (0.1% available chlorine) powder of solution
  Carbamazepine 100mg/5ml oral liquid
  Carbamazepine 100mg tablet (chewable)
  Carbamazepine 100mg tablet (scored)
  Carbamazepine 200mg tablet (chewable)
  Carbamazepine 200mg tablet (scored)
  Codeine (phosphate) 30mg tablet
  Coagulation factor ix 500iu/ vial powder for injection
  Coagulation factor ix 1000iu/ vial powder for injection
  Cefalexin (anhydrous) 125mg/5ml powder for reconstitution with water
  Cefalexin (anhydrous) 250mg/5ml powder for reconstitution with water
  Cefalexin (monohydrate) 250mg solid oral dosage form
  Cefixime (trihydrate) 400mg capsule
  Ceftriaxone (sodium) 1g
  Ceftriaxone (sodium) 250mg
  Ceftazidime (pentahydrate) 1g powder for injection
  Ceftazidime (pentahydrate) 250mg powder for injection
  Cefazolin (sodium) 1g powder for injection
  Charcoal, activated powder
  Ergocholecalciferol 250mcg/ml (10000iu/ml)  oral liquid
  Ergocholecalciferol 1.25mg (50 000iu) solid oral dosage form
  Cholecalciferol 1000 iu solid oral dosage form
  Cholecalciferol 400iu/ml oral liquid
  Cholecalciferol 400iu solid oral dosage form
  Chlorhexidine (digluconate) 7.1% gel (delivering 4% chlorhexidine)
  Chlorhexidine (digluconate) 7.1% solution (delivering 4% chlorhexidine)
  Chlorhexidine (digluconate) 5% solution
  Cholera vaccine
  Ciclosporin 25mg capsule
  Ciprofloxacin (hydrochloride) 0.3% eye drops topical
  Cyclizine 50mg/ml injection
  Cyclizine 50mg tablet
  Clofazimine 50mg capsule
  Clofazimine 100mg capsule
  Calcium gluconate 100mg/ml in 10ml ampoule injection
  Clomifene (citrate) 50mg tablet
  Clindamycin (hydrochloride) 150mg capsule
  Clindamycin (phosphate) 150mg/ml injection
  Clindamycin (palmitate)  75mg/5ml oral liquid
  Clarithromycin 500mg solid oral dosage form
  Clotrimazole 1% vaginal cream
  Clotrimazole 10% vaginal cream
  Clotimazole 100mg vaginal cream
  Clotimazole 500mg vaginal cream
  Clozapine 25mg solid oral dosage form
  Clozapine 50mg solid oral dosage form
  Clozapine 100mg solid oral dosage form
  Clozapine 200mg solid oral dosage form
  Chloroquine (sulfate) 50mg/5ml oral liquid
  Chloroquine (phosphate) 50mg/5ml oral liquid
  Chloroquine (sulfate) 100mg tablet
  Chloroquine (phosphate) 100mg tablet
  Chloroquine (sulfate) 150mg tablet
  Chloroquine (phosphate) 150mg tablet
  Cloxacillin (sodium) 1g capsule
  Cloxacillin (sodium) 125mg/5ml powder for oral liquid
  Cloxacillin (sodium) 500mg capsule
  Cloxacillin (sodium) 500mg powder for injection
  Chlorambucil 2mg tablet
  Chloramphenicol (sodium succinate) 0.5g/ml in 2ml ampoule oily suspenson for injection
  Clomipramine (hydrochloride) 10mg capsule
  Chloramphenicol (sodium succinate) 1g powder for injection
  Clomipramine (hydrochloride) 25mg capsule
  Chloramphenicol (palmitate) 150mg/5ml oral liquid
  Chloramphenicol 250mg capsule
  Condoms
  Copper containing device
  Ciprofloxacin (hyclate) 2mg/ml soultion for iv infusion
  Ciprofloxacin (anhydrous) 250mg/5ml oral liquid
  Ciprofloxacin (hydrochloride) 250mg tablet
  Clopidogrel 75mg tablet
  Clopidogrel 300mg tablet
  Capreomycin (sulfate) powder for injection
  Chlorpromazine (hydrochloride) 10mg tablet
  Chlorpromazine (hydrochloride) 25mg/ml in 2ml ampoule
  Chlorpromazine (hydrochloride) 25mg/5ml oral liquid
  Chlorpromazine (hydrochloride) 25mg tablet
  Chlorpromazine (hydrochloride) 50mg tablet
  Chlorpromazine (hydrochloride) 100mg tablet
  Cisplatin 100mg/100ml injection
  Cisplatin 50mg/50ml injection
  Carboplatin 50mg/5ml injection
  Carboplatin 150mg/15ml injection
  Carboplatin 450mg/45ml injection
  Carboplatin 600mg/60ml injection
  Cycloserine (alternative may be terizidone)  250mg solid oral dosage form
  Coal tar  5% solution
  Carvedilol 25mg tablet
  Carvedilol 12.5mg tablet
  Carvedilol 6.25mg tablet
  Carvedilol 3.125mg tablet
  Cefotaxime (sodium) 250mg powder for injection
  Chloroxylenol 4.8% solution
  Cytarabine 100mg powder for injection
  Cyclophosphamide 25mg tablet
  Cyclophosphamide 500mg powder for injection
  Dapsone 25mg tablet
  Dapsone 50mg tablet
  Dapsone 100mg tablet
  Daunorubicin (hydrochloride) 50 mg in vial powder for injection
  Dasabuvir 250mg tablet
  Diethylcarbmazine (dihydrogen citrate) 50mg tablet
  Diethylcarbmazine (dihydrogen citrate) 100mg tablet
  Dacarbazine 100mg in vial powder for injection
  Daclatasvir (hydrochloride) 30mg capsule
  Dactinomycin 500mcg in vial powder for injectio
  Dimercaprol 50mg/ml 5ml ampoule, injection in oil
  Docusate sodium 50mg/5ml oral liquid
  Docusate sodium 100mg capsule
  Docetaxel 20mg/ml injection
  Dexamethasone 0.5mg solid oral dosage form
  Dexamethasone 0.75mg solid oral dosage form
  Dexamethasone 2mg/5ml oral liquid
  Dexamethasone 2mg tablet
  Dexamethasone 4mg/ml (1ml) disodium phosphate salt
  Dexamethasone 4mg tablet
  Dexamethasone 1.5mg solid oral dosage form
  Dexamethasone 4mg solid oral dosage form
  Dextran 70 6% injectable solution
  Deferoxamine (mesilate)  500mg, vial powder for injection f
  Digoxin 50mcg/ml oral liquid
  Digoxin 62.5mcg tablet
  Digoxin 250mcg/ml in 2ml ampoule
  Digoxin 250mcg tablet
  Diaphragm
  Diphtheria antitoxin 10 000 iu injection
  Diphtheria antitoxin 20 000 iu injection
  Diptheria vaccine
  Delamanid 50mg tablet
  Desmopressin (acetate) 4mc/ml in 1ml ampoule
  Darunavir 75mg tablet
  Darunavir 400mg tablet
  Darunavir 600mg tablet
  Darunavir 800mg tablet
  Doxycycline (hyclate) 100mg capsule
  Doxycycline (hydrochloride) 100mg capsule
  Doxycycline (hyclate) 100mg solid oral dosage form
  Doxycycline (hydrochloride) 100mg solid oral dosage form
  Doxycycline (monohydrate) tablet dispersible
  Doxorubicin (hydrochloride) 10mg powder for injection
  Doxorubicin (hydrochloride) 50mg powder for injection
  Dopamine (hydrochloiride) 40mg/ml in 5ml vial injection
  Doxycycline (anhydrous) 25mg/5ml oral liquid
  Doxycycline (anhydrous) 50mg/5ml oral liquid
  Doxycycline (hyclate) 50mg solid oral dosage form
  Diloxanide (furoate) 500mg tablet
  Diazepam 5mg/ml (0.5ml) gel
  Diazepam 5mg/ml (0.5ml) rectal solution
  Diazepam 5mg/ml (2 ml) gel
  Diazepam 2mg/5ml oral liquid
  Diazepam 5mg/ml (2ml) rectal solution
  Diazepam 2mg tablet scored
  Diazepam 2.5mg rectal solution
  Diazepam 5mg/ml (4 ml) gel
  Diazepam 5mg/ml (4ml) rectal solution
  Diazepam 5mg/ml injection
  Diazepam 5 mg rectal solution
  Diazepam 10 mg rectal solution
  Diazepam 5mg tablet
  Diazepam 5mg tablet scored
  Diazepam 10mg tablet
  Eflornithine (hydrochloride) 200mg/ml  injection in 100ml bottle
  Efavirenz (efv/efz) 50mg capsule
  Efavirenz (efv/efz) 600mg tablet
  Efavirenz (efv/efz) 100mg capsule
  Efavirenz (efv/efz) 200mg capsule
  Efavirenz (efv/efz) 200mg tablet scored
  Efavirenz & emtricitabine & tefonovir (disoproxil fumarate equivalent to 245mg tenofovir disoproxil) 600mg & 200mg & 300mg
  Ergometrine (hydrogen maleate) 200mcg in 1ml ampoule injection
  Ethambutol & isoniazid & pyrazinamide & rifampicin 275mg & 75mg & 400mg & 150mg
  Ethambutol & isoniazid & rifampicin 275mg & 75mg  & 150mg
  Erythromycin(ethyl succinate) 125mg/5ml powder for oral liquid
  Erythromycin(stearate) 125mg/5ml powder for oral liquid
  Erythromycin(estolate) 125mg/5ml powder for oral liquid
  Erythromycin (ethyl succinate) 250mg solid oral dosage form
  Erythromycin (stearate) 250mg solid oral dosage form
  Erythromycin (estolate) 250mg solid oral dosage form
  Erythromycin (lactobionate) 500mg powder for injection
  Ethionamide (protionamide my be alternative) 125mg tablet
  Ethionamide (protionamide my be alternative) 250mg tablet
  Emtricitabine & tefonovir (disoproxil fumarate equivalent to 245mg tenofovir disoproxil) 200mg & 300mg
  Enalapril (hydrogen maleate) 2.5mg
  Enalapril (hydrogen maleate) 5mg
  Entecavir 0.05mg/ml oral liquid
  Entecavir 0.5mg tablet
  Entecavir 1 mg tablet
  Ephedrine 30mg/ml (1ml)
  Epinephrine (adrenaline) (hydrochloride) 2% solution eye drops
  Epinephrine(adrenaline) hydrochloride 1mg/1ml
  Epinephrine(adrenaline) hydrogen tartrate 1mg/1ml
  Etonogestrel-releasing implant (single rod containing 68mg of etonogestrel)
  Estradiol cypionate & medroxyprogesterone acetate 5mg &25 mg injection
  Ethanol (denatured) solution 70%
  Ethosuximide 250mg capsule
  Ethosuximide 250mg/5ml oral liquid
  Ethinylestradiol  & levonorgestrel 30mcg & 150mcg tablet
  Ethambutol 25mg/ml oral liquid
  Ethambutol (hydrochloride)  100 mg tablet
  Ethambutol (hydrochloride)  200 mg tablet
  Ethambutol (hydrochloride)  400 mg tablet
  Ethinylestradiol  & norethisterone 35mcg & 1mg tablet
  Etoposide 20mg/ml in 5ml ampoule injection
  Etoposide 100mg capsule
  Enoxaparin 100mg/1ml ampoule injection
  Enoxaparin 100mg/1ml pre filled syringe
  Enoxaparin 120mg/1.2ml ampoule injection
  Enoxaparin 120mg/1.2mlpre filled syringe
  Enoxaparin 150mg/1.5ml ampoule injection
  Enoxaparin 150mg/1.5ml pre filled syringe
  Enoxaparin 20mg/0.2ml ampoule injection
  Enoxaparin 20mg/0.2ml pre filled syringe
  Enoxaparin 40mg/0.4ml ampoule injection
  Enoxaparin 40mg/0.4ml pre filled syringe
  Enoxaparin 60mg/0.6ml ampoule injection
  Enoxaparin 60mg/0.6ml pre filled syringe
  Enoxaparin 80mg/0.8ml ampoule injection
  Enoxaparin 80mg/0.8ml pre filled syringe
  Fluconazole 2mg/ml injection
  Fluconazole 50mg capsule
  Fluconazole 50mg/5ml oral liquid
  Fresh frozen plasma
  Fluorouracol 5% ointment
  Fluorouracil 50mg/ml in 5ml ampoule injection
  Flucytosine 2.5mg in 250ml  infusion
  Flucytosine 250mg capulse
  Fludrocortisone (acetate) 100mcg tablet
  Filgastrim 120mcg/0.2ml injection
  Filgastrim300mcg/ml in 1ml vial
  Filgastrim 300mcg/0.5ml injection
  Filgastrim 480mcg/0.8ml in prefilled syringe
  Filgastrim 480mg/1.6ml in 1.6ml vial
  Fluphenazine (decanoate) 25mg in 1ml ampoule
  Fluphenazine (enantate) 25mg in 1ml ampoule
  Fluorescein (sodium) 1% eye drops
  Fludarabine 10mg tablet
  Fludarabine (phosphate) 50mg powder for injection
  Fluoxetine 20mg solid dosage form
  Folic acid  1mg tablet
  Folic acid  5mg tablet
  Folic acid  400mcg tablet
  Fomepizole  (base) 1g/ml (1.5ml) injection
  Fomepizole (sulfate) 5mg/ml (20ml)
  Ferrous salt equivalent to 25mg iron (sulfate)/ml oral liquid
  Ferrous salt equivalent to 60 mg tablet
  Ferrous salt equivalent to 60 mg iron tablet and folic acid  400mcg tablet
  Furosemide 10mg/ml in 2ml ampoule
  Furosemide 10mg tablet
  Furosemide 20mg tablet
  Furosemide 40mg tablet
  Furosemide 20mg/5ml oral liquid
  Coagulation factor viii 500iu/vial powder for injection
  Glucagon 1mg/ml injection
  Gentamicin (sulfate) 0..3% eye drop solution
  Gliclazide (controlled release) 30mg solid oral dosage form
  Gliclazide (controlled release) 60mg solid oral dosage form
  Gliclazide (controlled release) 80mg solid oral dosage form
  Gliclazide (immediate release) 80mg solid oral dosage form
  Glucose with sodium chloride 5% glucose &0.9% sodium chloride injectable solution
  Glucose with sodium chloride 5% glucose &0.18% sodium chloride injectable solution
  Gutaral 2% solution
  Glyceryl trinitrate 500mcg sublingual tablet
  Glucose (isotonic) 5%
  Glucose (hypertonic) 10%
  Glucose (hypertonic) 50%
  Gemcitabine 1g powder for injecton
  Gemcitabine 200mg powder for injecton
  Gentamicin (sulfate) 10mg/ml in 2ml vial
  Gentamicin (sulfate) 40mg/ml in 2ml vial
  Griseofulvin 125mg/ml oral liquid
  Griseofulvin 125mg solid oral dosage form
  Griseofulvin  250mg solid oral dosage form
  Hydrocortisone retention enema
  Hydrocortisone (acetate) 1% cream
  Hydrocortisone (acetate) 1% ointment
  Hydrocortisone 5mg tablet
  Hydrocortisone 10mg tablet
  Hydrocortisone 20mg tablet
  Hydrocortisone (acetate) 25mg suppository
  Hydrocortisone (sodium succinate) 100mg powder for injection
  Hydroxychloroquine (sulfate) 200mg solid oral dosage form
  Hepatitis a vaccine
  Hepatitis b vaccine
  Heparin (sodium) 1000iu/ml injection
  Heparin (sodium) 10000iu/ml injection
  Heparin (sodium) 20,000iu/ml injection
  Haloperidol 5mg/1ml (1ml)
  Haloperidol 0.5mg tablet
  Haloperidol 2mg/ml oral liquid
  Haloperidol 2mg tablet
  Haloperidol 5mg tablet
  Halothane
  Hpv vaccine
  Hydrochlorothiazide 12.5mg solid oral dosage form
  Hydrochlorothiazide 25mg solid oral dosage form
  Hydrochlorothiazide 25mg stablet scored
  Hydrochlorothiazide 50mg/ml oral liquid
  Hydroxocobalamin (acetate) 1mg in 1ml ampoule injection
  Hydroxocobalamin (hydrochloride) 1mg in 1ml ampoule injection
  Hydroxocobalamin (sulfate) 1mg in 1ml ampoule injection
  Hydroxycarbamide 1g solid oral dosage form
  Hydroxycarbamide 200mg solid oral dosage form
  Hydroxycarbamide 250mg solid oral dosage form
  Hydroxycarbamide 300mg solid oral dosage form
  Hydroxycarbamide 400mg solid oral dosage form
  Hydroxycarbamide 500mg solid oral dosage form
  Hyoscine buytlbromide 20g/ml injection
  Hydralazine (hydrochloride) 20mg powder for injection
  Hydralazine (hydrochloride) 25mg  tablet
  Hydralazine (hydrochloride) 50mg  tablet
  Hyoscine hydrobromide 1mg/72 hrs transdermal patch
  Hyoscine hydrobromide 400mcg/ml injection
  Hyoscine hydrobromide 600mcg/ml injection
  Ibuprofen 5mg/ml solution for injection
  Ibuprofen 200mg/5ml oral liquid
  Ibuprofen 200mg tablet
  Ibuprofen 400mg tablet
  Ibuprofen 600mg tablet
  Ivermectin 3mg tablet (scored)
  Ifosfamide 1g vial powder for injection
  Ifosfamide 2g vial powder for injection
  Ifosfamide 500mg vial powder for injection
  Iohexol (iodine) 140mg in 5ml ampoule
  Iohexol (iodine) 140mg in 10ml ampoule
  Iohexol (iodine) 140mg in 20ml ampoule
  Iohexol (iodine) 350mg in 5ml ampoule
  Iohexol (iodine) 350mg in 10ml ampoule
  Iohexol (iodine) 350mg in 20ml ampoule
  Imatinib 100mg tablet
  Imatinib 400mg tablet
  Intermediate acting insulin (isophane insulin) 100iu/ml in 10ml vial
  Intermediate acting insulin (zinc suspension) 100iu/ml in 10ml vial
  Intermediate acting insulin (isophane insulin) 40iu/ml in 10ml vial
  Intermediate acting insulin (zinc suspension) 40iu/ml in 10ml vial
  Influenza vaccine
  Insulin (soluble) injection 100iu/ml in 10l vial
  Insulin (soluble) injection 40iu/ml in 10l vial
  Iodine 200mg capsule
  Iodine 0.57ml iodized oil (308mg iodine) in dispenser bottle
  Iodine 0.5ml iodized oil (240mg iodine) in ampoule (injectable
  Iodine 0.5ml iodized oil (240mg iodine) in ampoule (oral)
  Iodine 1ml iodized oil (480mg iodine) in ampoule (injectable
  Iodine 1ml iodized oil (480mg iodine) in ampoule (oral)
  Imipendem (monohydrate) & cilastatin (sodium) 250mg & 250mg powder for injection
  Imipendem (monohydrate) & cilastatin (sodium) 500mg & 500mg powder for injection
  Alcohol based hand rub (isopropyl) solution 75% volume/volume
  Ipratropium bromide 20mcg/dose inhalation aerosol
  Intraperitoneal dialysis solution
  Irinotecan 100mg in 5ml vial
  Irinotecan 40mg in 2ml vial
  Irinotecan 500mg in 25ml vial
  Isosorbide dinitrate 5mg sublingual tabl
  Isoflurane
  Isoniazid & pyrazinamide & rifampicin  150mg & 500mg & 150mg
  Isoniazid & pyrazinamide & rifampicin  75mg & 400mg & 150mg
  Isoniazid & rifampicin 150mg & 150mg
  Isoniazid & rifampicin 150mg & 300mg
  Isoniazid & rifampicin 60mg & 60mg
  Isoniazid & rifampicin 75mg & 150mg
  Isoniazid 50mg/5ml oral liquid
  Japanese encephalitis vaccine
  Kanamycin (sulfate) 1g powder for injection
  Ketamine (50mg/ml,10ml)
  Latanoprost 50mcg/ml solution eye drops
  Lactulose 3.1-3.7g/5ml oral liquid
  Levofloxacin (ofloxacin and moxifloxacin may be alternatives) 250mg tablet
  Levofloxacin (ofloxacin and moxifloxacin may be alternatives) 500mg tablet
  Levofloxacin (ofloxacin and moxifloxacin may be alternatives) 750mg tablet
  Lignocaine 5% (spinal, 2ml amp mixed with 7.5% glucose)
  Lignocaine (hydrochloride) 20mg/ml in 5ml ampoule injection
  Lignocaine 1%
  Lignocaine 2%
  Lignocaine 2% (topical)
  Lignocaine4% (topical)
  Lamivudine & nevirapine & stavudine 150mg & 200mg & 30 mg tablet
  Lamivudine & nevirapine & stavudine 30mg & 50mg & 6mg
  Lamivudine & nevirapine & zidovudinestavudine 150mg & 200mg & 300 mg tablet
  Lamivudine & nevirapine & zidovudine 30mg & 50mg & 60mg tablet
  Lamuvidine (3tc) 50mg tablet
  Lamivudine(3tc) 50mg/ml oral liquid
  Lamivudine &  zidovudinee 150mg & 300 mg tablet
  Lamivudine &  zidovudine 30mg  & 60mg tablet
  Lignocaine (hydrochloride) 1% & epinephrine (adrenaline) 1:200 000
  Lignocaine (sulfate)  1% & epinephrine (adrenaline) 1:200 000
  Lignocaine 2% & epinephrine 1:80 000
  Lignocaine (hydrochloride) 2% & epinephrine (adrenaline) 1:200 000
  Lignocaine (sulfate) 2% & epinephrine (adrenaline) 1:200 000
  Linezolid 2mg/ml in 300ml bag injection for intravenous administration
  Linezolid 100mg/5ml powder for oral liquid
  Linezolid 400mg tablet
  Linezolid 600mg tablet
  Leuprorelin dose form
  Loperamide 2mg solid dosage form
  Ledipasvir & sofosbuvir 90mg & 400mg tablet
  Lopinavr & ritonavir (lpv/r) 100mg & 25mg tablet (heat stable)
  Lopinavr & ritonavir (lpv/r) 200mg & 50mg tablet (heat stable)
  Lopinavr & ritonavir (lpv/r)  400mg & 100mg/5ml oral liquid
  Loratadine 1mg/ml oral liquid
  Loratadine 10mg tablet
  Lithium carbonate 300mg solid oral dosage form
  Levothyroxine (sodium salt) 25mcg tablet
  Levothyroxine (sodium salt) 50mcg tablet
  Levothyroxine (sodium salt) 100mcg tablet
  Lugol's solution 130mg (total iodide)/ml oral liquid
  Levodopa & carbidopa tablet 100mg & 10mg
  Levodopa & carbidopa tablet 100mg & 25mg
  Levodopa & carbidopa tablet 250mg & 25mg
  Levonorgestrel 30mcg tablet
  Levonorgestrel-releasing implant (two rods containing 75mg of levonorgestrel each)
  Levonorgestrel 750mcg tablet pack of two
  Levonorgestrel 1.5mg tablet
  Levamisole (hydrochloride) 50mg tablet
  Levamisole (hydrochloride) 150mg tablet
  Levonorgestrel-releasing intrauterine system with reservoir containing 52mg of levonorestrel
  Lorazapeam 2 mg/ml (1ml) parenteral formulation
  Lorazapeam 4 mg/ml (1ml) parenteral formulation
  Mebendazole 100mg tablet (chewable)
  Mebendazole 500mg tablet (chewable)
  Metoclopramide (hydrochloride) 5mg/2ml injection
  Metoclopramide 5mg/5ml oral liquid
  Metoclopramide (hydrochloride) 10mg solid dosage form
  Miconazole (nitrate) 2% cream
  Miconazole (nitrate) 2% ointment
  Methadone (hydrochloride) concentrate for oral liquid 5mg/ml
  Methadone (hydrochloride) concentrate for oral liquid 10mg/ml
  Methyldopa 250mg tablet
  Metronidazole 1g suppository
  Metronidazole (benzoate) 200mg/5ml oral liquid
  Metronidzole 200mg tablet
  Metronidzole 400mg tablet
  Metronidazole 500mg in 100ml vial
  Metronidazole 500mg suppository
  Metronidzole 500mg tablet
  Midazolam 1mg/mlampoule for buccal administration
  Midazolam 1mg/ml injection
  Midazolam 2mg/ml oral liquid
  Midazolam 5mg/ml injection
  Midazolam 5mg/ml solution for ora lmucosal administration
  Midazolam 7.5mg solid dosage form
  Midazolam 7.5mg tablet
  Midazolam 10mg/mlampoule for buccal administration
  Midazolam 10mg/ml solution for ora lmucosal administration
  Midazolam 15mg tablet solid dosage form
  Midazolam 15mg tablet
  Mercaptopurine tablet 50mg
  Mesna 100mg/ml in 4ml ampoule
  Mesna 100mg/ml in 10ml ampoule
  Mesna 400mg tablet
  Mesna 600mg tablet
  Mifepristone-misoprostol 200mg-200mcg tablets
  Mefloquine (hydrochloride) 250mg tablet
  Miltefosine 10mg solid oral dosage form
  Miltefosine 50 mg solid oral dosage form
  Meglumine antimoniate 100mg/ml, 1 vial =30ml or 30% equivalent to approvimately 8.1% antimony (pentavelent in 5ml ampoule)
  Meglumine iotroxate 5g /100ml solution
  Meglumine iotroxate 5g /250ml solution
  Meglumine iotroxate 6g /100ml solution
  Meglumine iotroxate 6g /250ml solution
  Meglumine iotroxate 7g /100ml solution
  Meglumine iotroxate 7g /250ml solution
  Meglumine iotroxate 8g /100ml solution
  Meglumine iotroxate 8g /250ml solution
  Magnesium (sulfate) 0.5g/ml (2ml) equivalent to 1g/2ml; 50%w/v
  Magnesium (sulfate) 0.5g/ml (10ml) equivalent to 5g/10ml; 50%w/v
  Misoprostol 25mcg vaginal tablet
  Misoprostol 200mcg tablet
  Melarsoprol 3.6% solution, 5ml ampoul (180mg of active compound)
  Meningococcal menin+d963:d972gitis vaccine
  Methyloninium chloride (methylene blue) 10mg/ml, ampoule injection
  Mannitol 10% injectable solution
  Mannitol 20% injectable solution
  Mupirocin (calcium)  2% cream
  Mupirocin 2% ointment
  Morphine (hydrochloride) 10mg/ml (1ml)
  Morphine (sulfate) 10mg/ml (1ml)
  Morphine (hydrochloride) 10mg ir tablet
  Morphine (sulfate) 10mg ir tablet
  Morphine (hydrochloride) 10mg/5ml oral liquid
  Morphine (sulfate) 10mg/5ml oral liquid
  Morphine (hydrochloride) 10mg sr tablet
  Morphine (sulfate) 10mg sr tablet
  Morphine (hydrochloride) 15mg sr tablet
  Morphine (sulfate) 15mg sr tablet
  Morphine (sulfate) 20mg granules (suspension)
  Morphine (sulfate) 30mg granules (suspension)
  Morphine (hydrochloride) 30mg sr tablet
  Morphine (sulfate) 30mg sr tablet
  Morphine (sulfate) 60mg granules (suspension)
  Morphine (hydrochloride) 60mg sr tablet
  Morphine (sulfate)60mg sr tablet
  Morphine (sulfate) 100mg granules (suspension)
  Morphine (hydrochloride) 100mg sr tablet
  Morphine (sulfate) 100mg sr tablet
  Morphine (sulfate) 200mg granules (suspension)
  Morphine (hydrochloride) 200mg sr tablet
  Morphine (sulfate) 200mg sr tablet
  Metformin (hydrochloride) 500mg tablet
  Methotrexate (sodium) 2.5mg
  Methotrexate (sodium) 50mg powder for injection
  Metoprolol 50mg tablet
  Metoprolol 100mg tablet
  Methylprednisolone (sodium succinate) 40mg/ml in 1ml ampoule
  Methylprednisolone (sodium succinate) 40mg/ml in 5ml multi dose vial
  Methylprednisolone (sodium succinate) 80mg/ml in 1ml ampoule
  Mumps vaccine
  Medroxyprogesterone acetate 5mg tablet
  Medroxyprogesterone acetate depot injection 150mg/ml in 1ml vial
  Sodium chloride 0.9% isotonic injectable solution
  Sodium fluoride topical formulation
  Sodium hydrogen carbonate 1.4% isotonic injectiable solution
  Sodium hydrogen carbonate 8.4% in 10ml ampoule solution
  Sodium lactate,compound solution
  Niclosamide 500mg tablet (chewable)
  Nicotinamide 50mg tablet
  Nifedipine 10mg immediate release capsule
  Nifurtimox 30mg tablet
  Nifurtimox 120mg tablet
  Nifurtimox 250mg tablet
  Naloxone (hydrochloride) 400mcg/1ml ampoule
  Normal immunoglobulin 5% protein solution for intravenous administration
  Normal immunoglobulin 10% protein solution for intravenous administration
  Normal immunoglobulin 15% protein solution for subcutaneous administration
  Normal immunoglobulin 16% protein solution for intramuscular administration
  Normal immunoglobulin 16% protein solution for subcutaneous administration
  Norethisterone enantate 200mg/ml in 1ml ampoule oily solution
  Nicotine replacemet therapry 2mg chewing gum (polacrilex)
  Nicotine replacemet therapry 4mg chewing gum (polacrilex)
  Nicotine replacemet therapry 5mg-30mg/16hrs transdermal patch
  Nicotine replacemet therapry 7mg-21mg/24hrs transdermal patch
  Neostigmine (metilsulfate) 2.5mg in 1ml ampoule injection
  Neostigmine (bromide) 15mg tablet
  Neostigmine 500mcg in 1ml ampoule injection
  Nitrofurantoin 25mg/5ml oral liquid
  Nitrofurantoin 100mg tablet
  Nitrous oxide
  Nevirapine (nvp) 50mg/5ml oral liquid
  Nevirapine (nvp) 50mg tablet (dispersible)
  Nevirapine (nvp) 200mg tablet
  Nystatin 100,000 iu tablet
  Nystatin 50mg/ml oral liquid
  Nystatin 100,000iu lozenge
  Nystatin 100,000 iu oral liquid
  Nystatin 100,000 iu pessary
  Nystatin 500,000 iu tablet
  Ofloxacin 0.3% eye drop solution
  Oseltamivir (phosphate) 30mg capsule
  Oseltamivir (phosphate) 45mg capsule
  Oseltamivir (phosphate) 70mg capsule
  Omeprazole 10mg solid oral dosage form
  Omeprazole 20mg  powder for oral liquid
  Omeprazole 20mg solid oral dosage form
  Omeprazole 40mg in vial powder for injection
  Omeprazole 40mg  powder for oral liquid
  Omeprazole 40mg solid oral dosage form
  Oseltamivir 12mg/ml oral powder
  Ombitasvir & paritaprevir & ritonavir 12.5mg & 75mg & 50mg tablet
  Ondansetron hydrochloride 2mg base/ml (2ml)
  Ondansetron 4mg base/5ml oral liquid
  Ondansetron 4mg base solid dosage form
  Ondansetron 8mg base solid dosage form
  Ondansetron 24mg base solid dosage form
  Oral rehydration salts powder for filution in 200ml
  Oral rehydration salts powder for filution in 500ml
  Oral rehydration salts powder for filution in 1l
  Oxygen
  Oxamniquine 50mg/5ml oral liquid
  Oxamniquine 250mg capsule
  Oxaliplatin 50mg in 10ml vial injection
  Oxaliplatin 50mg powder for injection
  Oxaliplatin 100mg powder for injection
  Oxaliplatin 100mg in 20ml vial injection
  Oxaliplatin 200mg in 40ml vial injection
  Oxytocin 10iu/1ml injection
  Pancreatic enzymes
  P-aminosalicyclic acid 4g granules
  P-aminosalicyclic acid 500mg tablet
  Procarbaine (hydrochloride) 50mg capsule
  Procaine benzylpenicillin 1g (1 million iu) powder for injection
  Procaine benzylpenicillin 3g (3 million iu) powder for injection
  Paracetamol 300mg tablet
  Paracetamol 400mg tablet
  Paracetamol 500mg tablet
  Paclitaxel 6mg/ml powder for injection
  Prednisolone (sodium phosphate)  0.5% solution eye drops
  Prednisolone 5mg/ml oral liquid
  Prednisolone 5mg tablet
  Prednisolone 25mg tablet
  Podophyllum resin 10% solution
  Podophyllum resin 25% solution
  Pyridoxine (hydrochloride) 25mg
  Pertussis vaccine
  Potassium ferric hexacyano-ferrate(ii) - 2(h20) (prussian blue) posder for oral administration
  Pegylated interferon alpha 2a 180mcg  prefilled syringe
  Pegylated interferon alpha 2a 180mcg  vial
  Pegylated interferon alpha 2b 80mcg prefilled syringe
  Pegylated interferon alpha 2b 180mcg  vial
  Pegylated interferon alpha 2b 100mcg prefilled syringe
  Pegylated interferon alpha 2b 100mcg  vial
  Proguanil (hydrochloride) 100mg tablet
  Phenobarbital 15mg tablet
  Phenobarbital 25mg/30ml oral liquid
  Phenobarbital 30mg/30ml oral liquid
  Phenobarbital 60mg tablet
  Phenobarbital 100mg tablet
  Phenobarbital (sodium) 200mg/ml injection
  Phenobarbital 200mg tablet
  Phenytoin 25mg/30ml oral liquid
  Phenytoin (sodium) 25mg  solid dosage form
  Phenytoin 30mg/30ml oral liquid
  Phenytoin (sodium) 50mg/5ml injection
  Phenytoin (sodium) 50mg  solid dosage form
  Phenytoin 50mg chewable tablet
  Phenytoin (sodium) 100mg  solid dosage form
  Pilocarpine (nitrate) 2% solution eye drops
  Pilocarpine (hydrochloride) 2% solution eye drops
  Pilocarpine (nitrate) 4% solution eye drops
  Pilocarpine (hydrochloride) 4% solution eye drops
  Platelets
  Paromomycin base (sulfate)  750mg solution for intramuscular injection
  Pentamidine (isethionate) 200mg powder for injection
  Pentamidine (isethionate) 200mg tablet
  Pentamidine (isethionate) 300mg tablet
  Phytomenadione 1mg/ml injection
  Phytomenadione 10mg/ml in 5ml ampoule  injection
  Phenoxymethylpenicillin (potassium) 250mg/5ml powder for oral liquid
  Phenoxymethylpenicillin (potassium) 250mg tablet
  Primaquine (diphosphate) 7.5mg tablet
  Primaquine (diphosphate) 15mg tablet
  Penicillamine 250mg solid oral dosage form
  Pneumococcal vaccine
  Potassium iodide 60mg tablet
  Poliomyelitis vaccine
  Polygeline 3.5% injectable solution
  Propranolol (hydrochloride) 20 mg tablet
  Propranolol (hydrochloride) 40 mg tablet
  Propofol (10mg/ml)
  Propofol (50mg/ml)
  Pyrimethamine 25mg tablet
  Pyrantel (embonate) 50mg/ml oral liquid
  Pyrantel (pamoate) 50mg/ml oral liquid
  Pyrantel (embonate) 250mg tablet (chewable)
  Pyrantel (pamoate) 250mg tablet (chewable)
  Progesterone vaginal ring (containing 2.074g of micronized progesterone)
  Pyrazinamide 30mg/ml
  Pyrazinamide 150mg tablet dispersible
  Pyrazinamide 150mg tablet scored
  Pyrazinamide 400mg tablet
  Prostaglandin e1, 0.5mg/ml in alcohol solution for injection
  Prostaglandin e2, 1mg/ml solution for injection
  Potassium permanganate aqueous solution 1:10 000
  Potassium chloride powder for solution
  Potassium chloride  solution for dilution 7.5%
  Potassium chloride  solution 11.2% in 20ml ampoule
  Potassium chloride  solution for dilution 15%
  Propylthiouracil 50mg tablet
  Permehtrin 1% ointment
  Permehtrin 5% cream
  Potassium iodide (saturated solution)
  Protamine sulfate 10mg/ml in 5ml
  Povidine iodine 10% (equivalent to 1%
  Pydiostigmine (bromide) 60mg tablet
  Pyidostigmine 1mg in 1ml ampoule injection
  Praziquantal 150mg tablet
  Praziquantal 600mg tablet
  Quinine (bisulfate) 300mg tablet
  Quinine (sulfate) 300mg tablet
  Quinine (hydrochloride) 300mg/ml in 2ml ampoule
  Rabies vaccine
  Riboflavin 5mg tablet
  Ribavirin 1g in 10ml phosphate buffer solution
  Ribavirin 200mg solid oral dosage form
  Ribavirin 400mg solid oral dosage form
  Ribavirin 600mg solid oral dosage form
  Ribavirin 800mg in 10ml phosphate buffer solution
  Red blood cells
  Rifabutin 150mg capsule
  Rifampicin 20mg/ml oral liquid
  Rifampicin 150mg solid oral dosage form
  Rifampicin 300 mg solid oral dosage form
  Risperidone 0.25mg solid oral dosage form
  Risperidone 0.5mg solid oral dosage form
  Risperidone 1mg solid oral dosage form
  Risperidone 2mg solid oral dosage form
  Risperidone 3mg solid oral dosage form
  Risperidone 4mg solid oral dosage form
  Risperidone 5mg solid oral dosage form
  Risperidone 6mg solid oral dosage form
  Ranitidine (hydrochloride)150mg tablet
  Ranitidine (hydrochloride) 25mg/ml in 2ml ampoule
  Ranitidine (hydrochloride) 75mg/5ml oral liquid
  Ritonavir 25mg tablet (heat stable)
  Ritonavir 100mg tablet (heat stable)
  Ritonavir 400mg/5ml oral liquid
  Rotavirus vaccine
  Rifapentine 150mg tablet
  Retinol (palmitate) 10 000 iu tablet (sugar coated)
  Retinol (palmitate) 50 000 iu capsule
  Retinol (palmitate) 100 000 iu capsule
  Retinol (palmitate) 100 000iu water-miscible injection  in 2ml ampoule
  Retinol (palmitate) 100 000 iu/ml oral oily solution in multidose dispenser
  Retinol (palmitate) 200 000 iu capsule
  Rubella vaccine
  Rituximab 100mg/10ml injection
  Rituximab 500mg/50ml
  Salicyclic acid 5% solution
  Salbutamol (sulfate) 5mg respirator solution for use in nebulisers 5mg/ml
  Salbutamol (sulfate) 50mcg/ml in 5ml ampoule injection
  Salbutamol (sulfate) 100mcg inhalation  (aerosol)
  Salbutamol (sulfate) 100mcg metered dose inhaler
  Sodium thiosulfate 15% solution
  Stavudine (d4t) 5mg/5ml powder for oral liquid
  Stavudine (d4t) 15mg capsule
  Stavudine (d4t) 20mg capsule
  Stavudine (d4t) 30mg capsule
  Senna 7.5mg/5ml oral liquid
  Senna (sennosides) 7.5 mg tablet
  Surfactant 25mg/ml suspension for intratracheal instillation
  Surfactant 80mg/ml suspension for intratracheal instillation
  Silver sulfadiazine 1% cream
  Sofosbuvir 400mg tablet
  Sulfadiazine 500mg tablet
  Sulfadoxine & pyrimethamine 500mg & 25mg tablet
  Selenium sulfide detergent based suspension 2%
  Sodium calcium edetate 200mg/ml (5ml)
  Sodium nitrate 30mg/ml, 10ml ampoule
  Suramin sodium 1g powder for injection
  Sodium thiosulfate 250mg/ml, 50ml ampoule
  Simvastatin 5mg tablet
  Simvastatin 10mg tablet
  Simvastatin 20mg tablet
  Simvastatin 40mg tablet
  Sodium nitroprusside 50mg powder for injection
  Streptomycin (sulfate) 1g powder for injection
  Spectinomycin (hydrochloride) 2g powder for injection
  Spironolactone 10mg/5ml oral liquid
  Spironolactone 25mg/5ml oral liquid
  Spironolactone 5mg/5ml oral liquid
  Spironolactone 25mg tablet
  Simeprevir 150mg capsule
  Saquinavir(sqv) (mesilate) 200mgs solid oral dosage form
  Sodium stibogluconate 100mg/ml, 1 vial =30ml or 30% equivalent to approvimately 8.1% antimony (pentavelent in 5ml ampoule)
  Sulfasalazine retention enema
  Sulfasalazine 500mg suppository
  Sulfasalazine 500mg tablet
  Streptokinase 1.5 million iu in vial powder for injection
  Succimer 100mg solid oral dosage form
  Suxamethonium (chloride) 50mg/ml in 2ml ampoule injection
  Suxamethonium (chloride) 50mg powder for injection
  Sulfamethoxazole & trimethoprim 100mg & 20mg tablet
  Sulfamethoxazole & trimethoprim 200mg & 40mg / 5ml oral liquid
  Sulfamethoxazole & trimethoprim 400mg & 80mg tablet
  Sulfamethoxazole & trimethoprim 80mg & 16mg in 5ml ampoule injection
  Sulfamethoxazole & trimethoprim 80mg & 16mg in 10ml ampoule injection
  Sulfamethoxazole & trimethoprim 800mg & 160mg tablet
  Terbinafine (hydrochloride) 1% cream
  Terbinafine (hydrochloride) 1% ointment
  Ethambutol & isoniazid 400mg & 150mg
  Tuberculins, purified protien derivative (ppd) injection
  Triclabendazole 250mg tablet
  Testosterone (enanthate) 200mg in 1 ml ampoule injection
  Tetanus vaccine
  Anti-tetanus immunoglobulin 500iu injection
  Tetracyclin (hydrochloride) 1% eye ointment
  Tenofovir disoproxo 245mg tablet
  Tenofovir disoproxol fumarate (tdf) 300mg tablet
  Tioguanine 40mg solid oral dosage form
  Thiamine (hydrochloride) 50mg tablet
  Timolol (hydrogen maleate) 0.5% solution eye drops
  Timolol (hydrogen maleate) 0.25% solution eye drops
  Tick-borne encephaliitis vaccine
  Tranexamic acid 100mg/ml in 10ml ampoule
  Trastuzumab dose from
  Tropicamide 0.5% eye drops
  Trimethoprim 50mg/5ml oral liquid
  Trimethoprim 100mg tablet
  Trimethoprim 200mg tablet
  Tetracaine (hydrochloride) 0.5% solution eye drops
  Tamoxifen (citrate) 10mg tablet
  Tamoxifen (citrate) 25mg tablet
  Typhoid vaccine
  Urea 5% cream
  Urea 5% ointment
  Urea 10% cream
  Urea 10% ointment
  Vancomycin (hydrochloride) 250mg powder for injection
  Varicella vaccine
  Vecuronium (bromide) 10mg powder for injection
  Valganciclovir 450mg tablet
  Valproic acid (sodium valproate) 100mg/ml (4ml)
  Valproic acid (sodium valproate) 100mg/ml (10ml)
  Valproic acid (sodium valproate) 100mg crushable tablet
  Valproic acid (sodium valproate) 200mg/5ml oral liquid
  Valproic acid (sodium valproate) 200mg tablet enteric coated
  Valproic acid (sodium valproate) 500mg tablet enteric coated
  Vinblastine (sulfate) 10mg powder for injection
  Vincristine (sulfate) 1mg powder for injection
  Vincristine (sulfate) 5mg powder for injection
  Verapamil (hydrochloride) 2.5mg/ml in 2ml ampoule
  Verapamil (hydrochloride) 40mg tablet
  Verapamil (hydrochloride) 80mg tablet
  Vinorelbine 10mg/ml in 1ml vial
  Vinorelbine 50mg/ml in 5ml vial
  Whole blood
  Water for injection 2ml ampoule
  Water for injection 5ml ampoule
  Water for injection 10ml ampoule
  Warfarin (sodium) 0.5mg tablet
  Warfarin (sodium) 1mg tablet
  Warfarin (sodium) 2mg tablet
  Warfarin (sodium) 5mg tablet
  Xylometazoline 0.05% nasal spray
  Yellow fever vaccine
  Zidovudine (zdv/azt) 10mg/ml in 20ml vial solution of iv infusion injection
  Zidovudine (zdv/azt) 50mg/5ml oral liquid
  Zidovudine (zdv/azt) 100mg capsule
  Zidovudine (zdv/azt) 250mg capsule
  Zidovudine (zdv/azt) 300mg tablet
  Zinc sulfate 20mg solid oral dosage form
`).map(x => ({ ...x, type: 'drug' }));
