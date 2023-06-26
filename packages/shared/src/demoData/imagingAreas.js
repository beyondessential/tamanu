import { splitIds } from './utilities';

export const CT_SCAN_IMAGING_AREAS = splitIds(`
  Head - NCE
  Head - CE
  Abdomen - NCE
  Abdomen - CE
  Chest - NCE
  Chest - CE
  Extremities - NCE
  Extremities - CE
  Neck - NCE
  Neck - CE
  Chest - Biopsy - CE
  Chest - Biopsy - NCE
  Liver - Biopsy - CE
  Liver - Biopsy - NCE
  Left Kidney - Biopsy - CE
  Left - Kidney - Biopsy - NCE
  Right - Kidney - Biopsy - CE
  Right - Kidney - Biopsy - NCE
  Cervical Spines - Biopsy - CE
  Cervical Spines - Biopsy - NCE
  Thoracic Spines - Biopsy - CE
  Thoracic Spines - Biopsy - NCE
  Lumbar Spines - Biopsy - CE
  Lumbar Spines - Biopsy - NCE
  Liver - CT Guided Drainage
  Right Kidney CT Guided Drainage
  Left Kidney CT Guided Drainage
  Chest CT Guided Drainage
  Chest - Biopsy
  Orbits - NCE
  Orbits - CE
  Facial Bones - NCE
  Facial Bones - CE
  Petrous Bones/Mastoids/IAM - NCE
  Petrous Bone/Mastoids/IAM - CE
  Pelvis/Hip Joints - NCE
  Triphasic Liver Scan - NCE
  Rt Shoulder - CE
  Lt Shoulder - CE
  Rt Humerus - CE
  Lt Humerus - CE
  Rt Elbow - CE
  Lt Elbow - CE
  Rt Forearm/Wrist/Hand - CE
  Lt Forearm/Wrist/Hand - CE
  Rt Femur - CE
  Lt Femur - CE
  Rt Knee - CE
  Lt Knee - CE
  Rt Leg/Ankle/Foot - CE
  Lt Leg/Ankle/Foot - CE
  Rt Shoulder - NCE
  Lt Shoulder - NCE
  Rt Humerus - NCE
  Lt Humerus - NCE
  Rt Elbow - NCE
  Lt Elbow - NCE
  Rt Forearm/Wrist/Hand - NCE
  Lt Forearm/Wrist/ Hand - NCE
  Rt Femur - NCE
  Lt Femur - NCE
  Rt Knee - NCE
  Lt Knee - NCE
  Rt Leg/Ankle/Foot - NCE
  Lt Leg/Ankle/Foot - NCE
  Pelvis/Hip Joints - CE
  Triphasic Liver Scan - CE
  Cervical Spines - NCE
  Cervical Spines - CE
  Thoracic Spines - NCE
  Thoracic Spines - CE
  Lumbo - Sacral Spines - NCE
  Lumbo - Sacral Spines - CE
`);

export const X_RAY_IMAGING_AREAS = splitIds(`
  Left Toes
  Right Fingers
  Skeletal Survey (Bone Age)
  Abdomen - Erect
  Bone Age Study
  Chest - Pathology
  Chest - Routine Medical
  Facial Bones
  Hip Joints
  Larynx
  Legs & Knees (Charge Separately)
  Lumbo-Sacral Spines
  Mandibles
  Nose
  Open Reductions
  Sacro-Iliac joints
  Petrous Temporal Bone
  Phalanges
  Sacrum/Coccyx (Charge Separately)
  Scapula
  Paranasal Sinuses
  Skull
  Temporo-mandibular joints
  Thoracic Inlet
  Thoracic Spines
  Chest - Right Lateral Decubitus
  Humerus, Elbow & Proximal Forearm
  Right Toes
  Hips
  Shoulders
  Chest - Lateral Decubitus
  Abdomen - Right Lateral decubitus
  Left Thumb
  Sternum
  Chest - Left Lateral
  Chest - Right Lateral
  Chest - Apical
  Chest - Lordotic
  Mastoids
  Thoraco-Lumbar Spines (Charge separately)
  Chest - Ribs
  Coccyx
  Knees (Charged separately)
  Hands (Bilateral - 1 film)
  Lateral Decubitus
  Abdomen - Supine
  Right Thumb
  Foot
  Rt Ankle
  Hands
  Wrist
  Forearm
  Humerus
  Leg
  Chest - Left Lateral Decubitus
  Femur
  Clavicles
  Left Fingers
  Left Shoulder
  Right Shoulder
  Left Humerus
  Right Humerus
  Left Forearm
  Right Forearm
  Left Wrist
  Right Wrist
  Right Elbow
  Left Elbow
  Right Hand
  Left Hand
  Right Hip
  Left Hip
  Left Femur
  Right Femur
  Left Knee
  Right Knee
  Left Leg
  Right Leg
  Left Ankle
  Right Ankle
  Left Foot
  Right Foot
  Left Heel
  Right Heel
  Left Clavicle
  Right Clavicle
  Chest - Immigration
  Chest - Right Oblique
  Chest - Left Oblique
  Neck - Foreign Body
  Orbits
  Patella
  Patella (Duplicate)
  Acromio-clavicluar Joint
  Sacro-Iliac Joints (Duplicate)
  Kidney/ureter/Bladder
  Portable
  Portable - Chest
  Portable - Skull
  Portable - C.Spine
  Portable Femur
  Portable - Pelvis
  Portable - Left Leg
  Portable - Ankle
  Portable - Foot
  Portable - Elbow
  Portable - Forearm
  Portable - Wrist
  Portable - Left Hand
  Portable Right Hand
`);

export const ULTRASOUND_IMAGING_AREAS = splitIds(`
  Kidney/Ureter/Bladder
  Chest
  Chest wall
  Abdomen
  AFI
  Breast
  Doppler - Renal Artery
  Fetal Anomaly
  Gestational Age
  Head
  IUD
  Limbs
  Inguinal
  Pelvimetry
  Placenta
  Portable (Ultrasound)
  Abdominal Wall
  Prostate
  Psoas
  Renals
  Scrotum
  Thyroid
  Transvaginal
  Twins
  Urinary Bladder
  Pancrease
  Abdominal Aorta
  Soft Tissue (Charge as per site)
  Lower Limbs Arteriogram
  Biophysical Profile
  Presentation
  Pelvis
  Gallbladder
  Liver
  Adrenals
  Knee
  EFW
  Pelvis (Ultrasound)
  Soft Tissue
  Left Upper Limb Arteriogram
  Right Upper Limb Arteriogram
  Right Kidney - Biopsy
  Left Kidney - Biopsy
  Liver - Biopsy
  Chest - U/S Guided Drainage
  Right Kidney - U/S Guided Drainage
  Left Kidney - U/S Guided Drainage
  Liver - U/S Guided Drainage
  Ascites - U/S Guided Drainage
  Doppler - Renal Vein
  Doppler - Carotid Artery
  Doppler - Lower Limb
  Doppler - Upper Limp
  Doppler - Portal Vein
  Doppler - Hepatic Vein
  Doppler - Coeliac Trunk
  Doppler - Mesentetric
  Doppler - Abdominal Aorta
  Doppler - Middle Cerebral Atery
  Doppler - Umbilical Artery
  Doppler - Penile Artery
  Doppler - Testes
  Intra Uterine Death - Fetus
  Pancreases
  Neck - Soft Tissue
  Kidneys
`);
