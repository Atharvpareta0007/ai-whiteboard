import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as THREE from "three";
import SolarSystem from "./SolarSystem.jsx";

/* ═══ THEME ═══════════════════════════════════════════════ */
const T = {
  bg: "#04070d", surf: "#0a1220", surf2: "#0e1828",
  border: "#152233", border2: "#1a2d44",
  cyan: "#00d4ff", cyanDim: "#005f77", green: "#00ff88",
  amber: "#ffaa00", red: "#ff4d4d", purple: "#aa88ff",
  txt: "#c8e4ff", muted: "#34587a", dimTxt: "#1a3050",
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Inconsolata:wght@400;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#04070d;}
  ::-webkit-scrollbar{width:4px;height:4px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:#1a2d44;border-radius:4px;}
  ::-webkit-scrollbar-thumb:hover{background:#264060;}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes glow{0%,100%{box-shadow:0 0 10px #00d4ff22}50%{box-shadow:0 0 25px #00d4ff66}}
  @keyframes breathe{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.02)}}
  @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
  @keyframes wave{0%{height:5px}50%{height:28px}100%{height:5px}}
  @keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes tabSlide{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
  @keyframes cursorPing{0%{transform:scale(1);opacity:.9}100%{transform:scale(2.5);opacity:0}}
  @keyframes dwellFill{from{stroke-dashoffset:88}to{stroke-dashoffset:0}}
  @keyframes sunPulse{0%,100%{opacity:.06}50%{opacity:.15}}
  input,select,textarea{outline:none;}
  input::placeholder,textarea::placeholder{color:#34587a;}
  button{transition:all .2s ease;}
  button:disabled{opacity:.4;cursor:not-allowed!important;}
  button:not(:disabled):hover{filter:brightness(1.15);}
`;

const PLANETS = [
  { name: "Mercury", emoji: "⚫", size: .26, dist: 4.2, speed: .047, colors: ["#8c7b6b", "#6e5e50"], ring: false, info: { Diameter: "4,879 km", "Orbital Period": "88 days", Distance: "57.9M km", Moons: "0", Atmosphere: "Trace helium" }, fact: "A day on Mercury lasts 59 Earth days — longer than its year!" },
  { name: "Venus", emoji: "🟡", size: .48, dist: 6.2, speed: .035, colors: ["#e8c060", "#c49030"], ring: false, info: { Diameter: "12,104 km", "Orbital Period": "225 days", Distance: "108.2M km", Moons: "0", Atmosphere: "CO₂ thick clouds" }, fact: "Venus is the hottest planet at 465°C — hotter than Mercury!" },
  { name: "Earth", emoji: "🌍", size: .52, dist: 8.2, speed: .025, colors: ["#2a7dd4", "#1a5a9e"], ring: false, info: { Diameter: "12,742 km", "Orbital Period": "365.25 days", Distance: "149.6M km", Moons: "1", Atmosphere: "N₂ 78% O₂ 21%" }, fact: "Earth is the only known planet with liquid water on its surface." },
  { name: "Mars", emoji: "🔴", size: .38, dist: 10.6, speed: .020, colors: ["#c1430e", "#8b2e08"], ring: false, info: { Diameter: "6,779 km", "Orbital Period": "687 days", Distance: "227.9M km", Moons: "2", Atmosphere: "CO₂ 95%" }, fact: "Olympus Mons on Mars is the tallest volcano in the solar system." },
  { name: "Jupiter", emoji: "🟠", size: 1.18, dist: 14.6, speed: .013, colors: ["#c8883a", "#a06820"], ring: false, info: { Diameter: "139,820 km", "Orbital Period": "12 years", Distance: "778.5M km", Moons: "95", Atmosphere: "H₂ He NH₃" }, fact: "Jupiter's Great Red Spot storm has raged for over 350 years." },
  { name: "Saturn", emoji: "🪐", size: .98, dist: 19.0, speed: .009, colors: ["#e8c86a", "#c0a040"], ring: true, info: { Diameter: "116,460 km", "Orbital Period": "29 years", Distance: "1.43B km", Moons: "146", Atmosphere: "H₂ He" }, fact: "Saturn's rings span 282,000 km but are only ~10 metres thick!" },
  { name: "Uranus", emoji: "🔵", size: .66, dist: 23.0, speed: .007, colors: ["#7de8e8", "#50b0b0"], ring: false, info: { Diameter: "50,724 km", "Orbital Period": "84 years", Distance: "2.87B km", Moons: "28", Atmosphere: "H₂ He CH₄" }, fact: "Uranus rotates on its side with a 97.77° axial tilt." },
  { name: "Neptune", emoji: "🫐", size: .62, dist: 26.5, speed: .005, colors: ["#3f56e8", "#2030a0"], ring: false, info: { Diameter: "49,244 km", "Orbital Period": "165 years", Distance: "4.50B km", Moons: "16", Atmosphere: "H₂ He CH₄" }, fact: "Neptune has winds up to 2,100 km/h — the fastest in the solar system!" },
];

/* ═══ AI HELPER ═══════════════════════════════════════════ */
/* ═══ OFFLINE KNOWLEDGE BASE ══════════════════════════════ */
const OFFLINE_KB = {
  "newton": `📖 EXPLANATION\nNewton's Third Law states that for every action, there is an equal and opposite reaction. When one object exerts a force on a second object, the second object exerts an equal force back on the first — in the opposite direction. These are called action-reaction pairs.\n\n💡 EXAMPLES\n1. 🚀 Rocket Launch — A rocket pushes hot gas downward (action). The gas pushes the rocket upward (reaction), launching it into space.\n2. 🏊 Swimming — You push water backward with your hands (action). The water pushes you forward (reaction).\n3. 🧍 Standing — Your feet push down on the ground (action). The ground pushes up on you with a normal force (reaction).\n\n🔑 KEY POINTS\n• Forces always come in pairs — you can't have one without the other\n• The two forces act on DIFFERENT objects, not the same object\n• The forces are equal in magnitude but opposite in direction\n• This law applies to ALL forces: gravity, friction, electromagnetic, etc.\n\n❓ QUIZ QUESTIONS\n1. If you push a wall with 50N of force, how much force does the wall push back on you? → 50N (equal and opposite)\n2. Why don't action-reaction pairs cancel out? → Because they act on different objects`,

  "photosynthesis": `📖 EXPLANATION\nPhotosynthesis is the process by which green plants, algae, and some bacteria convert light energy (usually from the Sun) into chemical energy stored in glucose. It takes place primarily in the chloroplasts of plant cells, using chlorophyll — the green pigment that captures light.\n\nThe overall equation: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂\n\n💡 EXAMPLES\n1. 🌳 A tree absorbs sunlight through its leaves and converts CO₂ from the air + water from its roots into sugar for growth.\n2. 🌊 Phytoplankton in the ocean perform photosynthesis and produce about 50% of Earth's oxygen.\n3. 🌱 A houseplant near a window grows toward the light to maximize photosynthesis.\n\n🔑 KEY POINTS\n• Light-dependent reactions happen in the thylakoid membranes (split water, produce ATP & NADPH)\n• Light-independent reactions (Calvin Cycle) happen in the stroma (fix CO₂ into glucose)\n• Chlorophyll absorbs red and blue light, reflects green — that's why plants look green\n• Photosynthesis is the foundation of almost all food chains on Earth\n\n❓ QUIZ QUESTIONS\n1. What are the two main inputs of photosynthesis? → Carbon dioxide (CO₂) and water (H₂O)\n2. Where in the cell does photosynthesis occur? → In the chloroplasts`,

  "water cycle": `📖 EXPLANATION\nThe water cycle (hydrological cycle) is the continuous movement of water through Earth's systems. Water evaporates from oceans, lakes, and rivers into the atmosphere. It condenses into clouds, falls as precipitation (rain, snow, hail), and flows back to water bodies through rivers, groundwater, or surface runoff.\n\n💡 EXAMPLES\n1. ☀️ The Sun heats ocean water, causing evaporation — about 502,800 km³ of water evaporates yearly.\n2. 🏔️ Snow accumulates on mountains (precipitation), melts in spring, and flows into rivers as runoff.\n3. 🌿 Plants release water vapor through their leaves in a process called transpiration.\n\n🔑 KEY POINTS\n• Evaporation: liquid water → water vapor (requires heat energy from the Sun)\n• Condensation: water vapor → tiny water droplets in clouds (releases heat)\n• Precipitation: water falls from clouds as rain, snow, sleet, or hail\n• Collection/Runoff: water flows into rivers, lakes, oceans, or seeps into groundwater\n• Transpiration: plants release water vapor through stomata in their leaves\n\n❓ QUIZ QUESTIONS\n1. What drives the water cycle? → Energy from the Sun\n2. What is transpiration? → The process by which plants release water vapor through their leaves`,

  "pythagorean": `📖 EXPLANATION\nThe Pythagorean Theorem states that in a right-angled triangle, the square of the hypotenuse (the side opposite the right angle) equals the sum of the squares of the other two sides.\n\nFormula: a² + b² = c²  (where c is the hypotenuse)\n\n💡 EXAMPLES\n1. 📐 A triangle with sides 3, 4, and 5: 3² + 4² = 9 + 16 = 25 = 5² ✓\n2. 🏗️ Construction: To check if a corner is a perfect 90°, measure 3m, 4m, and 5m — if it works, it's a right angle!\n3. 📱 Finding a phone screen's diagonal: If a screen is 9cm × 12cm → diagonal = √(81+144) = √225 = 15cm\n\n🔑 KEY POINTS\n• Only works for RIGHT triangles (one angle must be exactly 90°)\n• The hypotenuse is always the LONGEST side and is opposite the right angle\n• You can use it to find ANY missing side: a = √(c² - b²)\n• Pythagorean Triples: whole number sets like (3,4,5), (5,12,13), (8,15,17)\n\n❓ QUIZ QUESTIONS\n1. If a right triangle has legs of 6 and 8, what is the hypotenuse? → 10 (6²+8² = 36+64 = 100, √100 = 10)\n2. Can the Pythagorean theorem be used on any triangle? → No, only right triangles`,

  "digestive": `📖 EXPLANATION\nThe human digestive system is a complex series of organs that breaks down food into nutrients the body can absorb and use for energy, growth, and repair. The journey takes 24-72 hours from mouth to elimination.\n\n💡 EXAMPLES\n1. 🍎 An apple enters your mouth → teeth break it down mechanically → saliva begins chemical digestion of starches\n2. 💧 Your stomach produces about 2 liters of gastric acid (HCl) daily — strong enough to dissolve metal!\n3. 🧬 The small intestine has millions of villi, giving it a surface area of about 250m² — the size of a tennis court\n\n🔑 KEY POINTS\n• Mouth: mechanical (teeth) + chemical (saliva/amylase) digestion begins\n• Esophagus: muscular tube that pushes food down via peristalsis\n• Stomach: churns food with HCl and pepsin → creates chyme (2-4 hours)\n• Small Intestine: main absorption site (6m long), bile + pancreatic enzymes finish digestion\n• Large Intestine: absorbs water and minerals, houses gut bacteria, forms feces\n• Liver & Pancreas: produce bile and digestive enzymes respectively\n\n❓ QUIZ QUESTIONS\n1. Where does most nutrient absorption occur? → The small intestine\n2. What is peristalsis? → Wave-like muscle contractions that move food through the digestive tract`,

  "solar system": `📖 EXPLANATION\nOur Solar System formed about 4.6 billion years ago from a giant cloud of gas and dust (solar nebula). It consists of the Sun (a G-type main-sequence star), 8 planets, 5 recognized dwarf planets, hundreds of moons, and billions of smaller objects like asteroids and comets.\n\n💡 EXAMPLES\n1. ☀️ The Sun contains 99.86% of all mass in the Solar System — it's enormous!\n2. 🪐 Jupiter's Great Red Spot is a storm larger than Earth that has raged for over 350 years\n3. 🌍 Earth is the only planet known to have liquid water on its surface and support life\n\n🔑 KEY POINTS\n• Inner planets (Mercury, Venus, Earth, Mars): rocky, smaller, closer to Sun\n• Outer planets (Jupiter, Saturn, Uranus, Neptune): gas/ice giants, much larger\n• The asteroid belt lies between Mars and Jupiter\n• Saturn's rings are made of ice and rock particles, spanning 282,000 km but only ~10m thick\n• Light from the Sun takes 8 minutes to reach Earth and 4+ hours to reach Neptune\n\n❓ QUIZ QUESTIONS\n1. Which planet is the largest in our Solar System? → Jupiter\n2. How many planets are in our Solar System? → 8 (Pluto was reclassified as a dwarf planet in 2006)`,

  "algebra": `📖 EXPLANATION\nAlgebra is a branch of mathematics where letters (variables like x, y) represent unknown numbers. It allows us to write general rules, solve equations, and describe relationships between quantities. The key idea: what you do to one side of an equation, you must do to the other.\n\n💡 EXAMPLES\n1. Solving 2x + 5 = 13: Subtract 5 from both sides → 2x = 8 → Divide by 2 → x = 4\n2. If a pizza costs $x and you buy 3: Total = 3x. If total is $24, then x = $8 per pizza\n3. The area of a rectangle: A = length × width → if A = 20 and width = 4, then length = 5\n\n🔑 KEY POINTS\n• Variables represent unknowns (x, y, z, etc.)\n• An equation is a statement that two expressions are equal (=)\n• To solve: isolate the variable using inverse operations\n• PEMDAS/BODMAS: order of operations (Parentheses, Exponents, Multiply/Divide, Add/Subtract)\n\n❓ QUIZ QUESTIONS\n1. Solve: 3x - 7 = 14 → x = 7\n2. What does "variable" mean in algebra? → A letter that represents an unknown number`,

  "cell": `📖 EXPLANATION\nCells are the basic building blocks of all living organisms. Every living thing — from bacteria to blue whales — is made of cells. There are two main types: prokaryotic (no nucleus, like bacteria) and eukaryotic (with a nucleus, like plant and animal cells).\n\n💡 EXAMPLES\n1. 🔴 Red blood cells carry oxygen throughout your body — you have about 25 trillion of them\n2. 🧫 A single bacterial cell can divide every 20 minutes, producing millions in just hours\n3. 🌿 Plant cells have cell walls and chloroplasts that animal cells don't\n\n🔑 KEY POINTS\n• Nucleus: control center, contains DNA\n• Mitochondria: "powerhouse of the cell" — produces energy (ATP)\n• Cell membrane: controls what enters and exits the cell\n• Ribosomes: make proteins\n• Plant cells also have: cell wall, chloroplasts, large central vacuole\n\n❓ QUIZ QUESTIONS\n1. What organelle is called the "powerhouse of the cell"? → Mitochondria\n2. What is the main difference between plant and animal cells? → Plant cells have a cell wall and chloroplasts`,

  "gravity": `📖 EXPLANATION\nGravity is one of the four fundamental forces of nature. It's the force of attraction between any two objects with mass. The more massive an object, the stronger its gravitational pull. Isaac Newton described it with his Law of Universal Gravitation, and Einstein refined it with General Relativity.\n\nFormula: F = G(m₁m₂)/r² where G = 6.674 × 10⁻¹¹ N⋅m²/kg²\n\n💡 EXAMPLES\n1. 🍎 An apple falls from a tree because Earth's gravity pulls it downward at 9.8 m/s²\n2. 🌙 The Moon orbits Earth because gravity provides the centripetal force\n3. ⚖️ You weigh less on the Moon (1/6 of Earth weight) because the Moon has less mass\n\n🔑 KEY POINTS\n• Gravity acts between ALL objects with mass — even you and your pencil\n• It decreases with the square of the distance (inverse square law)\n• On Earth's surface: g ≈ 9.8 m/s² (acceleration due to gravity)\n• Weight = mass × gravity (W = mg)\n\n❓ QUIZ QUESTIONS\n1. What is the acceleration due to gravity on Earth? → 9.8 m/s²\n2. Does gravity get stronger or weaker as objects get farther apart? → Weaker (inverse square law)`,

  "electricity": `📖 EXPLANATION\nElectricity is the flow of electric charge, usually through a conductor like a wire. It's caused by the movement of electrons. There are two types: static electricity (charges build up on surfaces) and current electricity (charges flow continuously through a circuit).\n\n💡 EXAMPLES\n1. ⚡ Lightning is a massive discharge of static electricity between clouds and the ground\n2. 💡 A light bulb works when current flows through a thin filament, heating it until it glows\n3. 🔋 A battery provides the voltage ("push") that drives electrons through a circuit\n\n🔑 KEY POINTS\n• Voltage (V): the "pressure" pushing electrons — measured in volts\n• Current (I): the rate of electron flow — measured in amperes (amps)\n• Resistance (R): how much a material opposes current — measured in ohms (Ω)\n• Ohm's Law: V = I × R\n• Series circuit: one path for current. Parallel circuit: multiple paths\n\n❓ QUIZ QUESTIONS\n1. What is Ohm's Law? → V = I × R (Voltage = Current × Resistance)\n2. What is the unit of electrical resistance? → Ohms (Ω)`,

  "dna": `📖 EXPLANATION\nDNA (Deoxyribonucleic Acid) is the molecule that carries the genetic instructions for all living organisms. It has a double helix structure — like a twisted ladder — discovered by Watson and Crick in 1953. The "rungs" are made of base pairs: Adenine-Thymine (A-T) and Guanine-Cytosine (G-C).\n\n💡 EXAMPLES\n1. 🧬 If you stretched out all the DNA in just ONE human cell, it would be about 2 meters long\n2. 👥 Humans share 99.9% of their DNA with every other human — we're incredibly similar!\n3. 🍌 Humans share about 60% of their DNA with bananas\n\n🔑 KEY POINTS\n• DNA is made of nucleotides: sugar (deoxyribose) + phosphate + base\n• Four bases: Adenine (A), Thymine (T), Guanine (G), Cytosine (C)\n• Base pairing rules: A-T and G-C (complementary base pairing)\n• Genes are segments of DNA that code for specific proteins\n• DNA replication: the molecule "unzips" and each strand serves as a template\n\n❓ QUIZ QUESTIONS\n1. What does DNA stand for? → Deoxyribonucleic Acid\n2. Adenine always pairs with which base? → Thymine (A-T)`,

  "climate": `📖 EXPLANATION\nClimate change refers to long-term shifts in global temperatures and weather patterns. While natural factors like volcanic eruptions and solar variations play a role, since the 1800s, human activities — mainly burning fossil fuels (coal, oil, gas) — have been the primary driver, releasing greenhouse gases that trap heat.\n\n💡 EXAMPLES\n1. 🌡️ Global average temperature has risen ~1.1°C since pre-industrial times\n2. 🧊 Arctic sea ice has decreased by about 13% per decade since 1979\n3. 🌊 Sea levels have risen about 21cm since 1900 and are accelerating\n\n🔑 KEY POINTS\n• Greenhouse Effect: CO₂, methane, and other gases trap heat in the atmosphere\n• CO₂ levels: ~280 ppm (pre-industrial) → 420+ ppm (today) — a 50% increase\n• Effects: rising seas, extreme weather, ecosystem disruption, ocean acidification\n• Solutions: renewable energy, energy efficiency, reforestation, carbon capture\n\n❓ QUIZ QUESTIONS\n1. What is the main greenhouse gas from human activity? → Carbon dioxide (CO₂)\n2. By how much has global temperature risen since pre-industrial times? → About 1.1°C`,

  "fractions": `📖 EXPLANATION\nA fraction represents a part of a whole. It has two numbers: the numerator (top, how many parts you have) and the denominator (bottom, how many equal parts the whole is divided into). For example, ¾ means 3 out of 4 equal parts.\n\n💡 EXAMPLES\n1. 🍕 If a pizza is cut into 8 slices and you eat 3, you ate 3/8 of the pizza\n2. ⏰ Half an hour = 1/2 hour = 30 minutes out of 60\n3. 💰 A quarter (25¢) is 1/4 of a dollar\n\n🔑 KEY POINTS\n• Adding fractions: need common denominator → 1/3 + 1/4 = 4/12 + 3/12 = 7/12\n• Multiplying fractions: multiply straight across → 2/3 × 3/4 = 6/12 = 1/2\n• Dividing fractions: flip the second and multiply → 2/3 ÷ 1/2 = 2/3 × 2/1 = 4/3\n• Simplify by dividing numerator and denominator by their GCF\n\n❓ QUIZ QUESTIONS\n1. What is 1/3 + 1/6? → 3/6 = 1/2\n2. What is 2/5 × 5/8? → 10/40 = 1/4`,

  "atoms": `📖 EXPLANATION\nAtoms are the smallest units of ordinary matter that form chemical elements. Every solid, liquid, gas, and plasma is composed of atoms. An atom consists of a nucleus (containing protons and neutrons) surrounded by a cloud of electrons.\n\n💡 EXAMPLES\n1. ⚛️ A hydrogen atom is the simplest: 1 proton, 0 neutrons, 1 electron\n2. 💧 A water molecule (H₂O) = 2 hydrogen atoms bonded to 1 oxygen atom\n3. 💎 A diamond is just carbon atoms arranged in a crystal lattice\n\n🔑 KEY POINTS\n• Protons: positive charge, in the nucleus, determine the element\n• Neutrons: no charge, in the nucleus, contribute to mass\n• Electrons: negative charge, orbit the nucleus in shells/energy levels\n• Atomic number = number of protons (defines the element)\n• Mass number = protons + neutrons\n\n❓ QUIZ QUESTIONS\n1. What determines which element an atom is? → The number of protons (atomic number)\n2. What charge does a neutron carry? → No charge (neutral)`,

  "shakespeare": `📖 EXPLANATION\nWilliam Shakespeare (1564–1616) was an English playwright, poet, and actor, widely regarded as the greatest writer in the English language. He wrote approximately 39 plays, 154 sonnets, and several longer poems. His works explore universal themes: love, power, jealousy, betrayal, comedy, and tragedy.\n\n💡 EXAMPLES\n1. 🎭 "Romeo and Juliet" — A tragic love story between two feuding families in Verona\n2. 👑 "Hamlet" — A prince of Denmark wrestles with revenge after his father's murder\n3. 🧙 "A Midsummer Night's Dream" — A magical comedy with fairies, lovers, and mistaken identities\n\n🔑 KEY POINTS\n• Born in Stratford-upon-Avon, performed at the Globe Theatre in London\n• Invented ~1,700 English words: "eyeball," "lonely," "generous," "bedroom"\n• Three types of plays: Comedies, Tragedies, and Histories\n• Famous quote: "To be, or not to be — that is the question" (from Hamlet)\n\n❓ QUIZ QUESTIONS\n1. How many plays did Shakespeare write? → Approximately 39\n2. Name the theatre where Shakespeare performed → The Globe Theatre`,
};

const OFFLINE_QUIZZES = {
  "solar system": [{ "q": "Which planet is closest to the Sun?", "options": ["Venus", "Mercury", "Mars", "Earth"], "answer": 1, "explanation": "Mercury orbits at just 57.9 million km from the Sun." }, { "q": "Which planet has the Great Red Spot?", "options": ["Saturn", "Mars", "Jupiter", "Neptune"], "answer": 2, "explanation": "Jupiter's Great Red Spot is a storm larger than Earth that has raged for 350+ years." }, { "q": "How many planets are in our Solar System?", "options": ["7", "8", "9", "10"], "answer": 1, "explanation": "There are 8 planets. Pluto was reclassified as a dwarf planet in 2006." }, { "q": "Which planet is known for its rings?", "options": ["Jupiter", "Uranus", "Neptune", "Saturn"], "answer": 3, "explanation": "While Jupiter, Uranus, and Neptune also have rings, Saturn's are by far the most prominent." }, { "q": "Which planet rotates on its side with a 98° tilt?", "options": ["Neptune", "Uranus", "Venus", "Mars"], "answer": 1, "explanation": "Uranus rotates nearly on its side, likely due to a massive ancient collision." }],
  "photosynthesis": [{ "q": "Where does photosynthesis occur in a plant cell?", "options": ["Nucleus", "Mitochondria", "Chloroplast", "Cell membrane"], "answer": 2, "explanation": "Chloroplasts contain chlorophyll, the green pigment that captures light energy." }, { "q": "What gas do plants absorb during photosynthesis?", "options": ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], "answer": 2, "explanation": "Plants absorb CO₂ from the air and use it to make glucose." }, { "q": "What is the main product of photosynthesis?", "options": ["Protein", "Glucose", "Fat", "DNA"], "answer": 1, "explanation": "Photosynthesis converts CO₂ and water into glucose (C₆H₁₂O₆) and oxygen." }, { "q": "Why do most plants appear green?", "options": ["They absorb green light", "They reflect green light", "They produce green oxygen", "Green is the color of water"], "answer": 1, "explanation": "Chlorophyll absorbs red and blue light but reflects green, making plants appear green." }, { "q": "What energy source drives photosynthesis?", "options": ["Wind", "Heat from Earth", "Sunlight", "Electricity"], "answer": 2, "explanation": "Solar energy (sunlight) provides the energy needed for the light-dependent reactions." }],
  "newton": [{ "q": "What does Newton's First Law state?", "options": ["F=ma", "Every action has an equal opposite reaction", "An object at rest stays at rest unless acted upon", "Energy cannot be created or destroyed"], "answer": 2, "explanation": "Newton's First Law (Law of Inertia) says objects maintain their state of motion unless a net force acts on them." }, { "q": "Newton's Second Law is expressed as:", "options": ["E=mc²", "F=ma", "V=IR", "a²+b²=c²"], "answer": 1, "explanation": "Force equals mass times acceleration (F=ma)." }, { "q": "If you push a wall with 100N, how much force does the wall push back?", "options": ["0N", "50N", "100N", "200N"], "answer": 2, "explanation": "Newton's Third Law: for every action there is an equal and opposite reaction." }, { "q": "What is inertia?", "options": ["A type of energy", "Resistance to change in motion", "A force", "Speed of an object"], "answer": 1, "explanation": "Inertia is an object's tendency to resist changes in its state of motion." }, { "q": "A 2kg object accelerates at 5m/s². What force is applied?", "options": ["2.5N", "7N", "10N", "3N"], "answer": 2, "explanation": "F = ma = 2kg × 5m/s² = 10N." }],
  "gravity": [{ "q": "What is Earth's gravitational acceleration?", "options": ["5.5 m/s²", "9.8 m/s²", "15.2 m/s²", "3.7 m/s²"], "answer": 1, "explanation": "On Earth's surface, g ≈ 9.8 m/s²." }, { "q": "Who formulated the Law of Universal Gravitation?", "options": ["Einstein", "Galileo", "Newton", "Kepler"], "answer": 2, "explanation": "Isaac Newton published his law in 1687 in the Principia Mathematica." }, { "q": "How does gravity change with distance?", "options": ["Stays the same", "Increases linearly", "Decreases with square of distance", "Doubles"], "answer": 2, "explanation": "Gravity follows an inverse square law: doubling distance quarters the force." }, { "q": "Your weight on the Moon compared to Earth is:", "options": ["The same", "1/6 of Earth weight", "Half", "Double"], "answer": 1, "explanation": "The Moon's gravity is ~1.6 m/s², about 1/6 of Earth's 9.8 m/s²." }, { "q": "What keeps the Moon in orbit around Earth?", "options": ["Magnetic force", "Solar wind", "Gravity", "Inertia alone"], "answer": 2, "explanation": "Earth's gravity provides the centripetal force that keeps the Moon in orbit." }],
  "cells": [{ "q": "What organelle is called the 'powerhouse of the cell'?", "options": ["Nucleus", "Ribosome", "Mitochondria", "Golgi body"], "answer": 2, "explanation": "Mitochondria produce ATP (energy) through cellular respiration." }, { "q": "Which structure is found in plant cells but NOT animal cells?", "options": ["Nucleus", "Cell membrane", "Cell wall", "Mitochondria"], "answer": 2, "explanation": "Plant cells have a rigid cell wall made of cellulose; animal cells do not." }, { "q": "What does the nucleus contain?", "options": ["Water", "DNA", "Chlorophyll", "Starch"], "answer": 1, "explanation": "The nucleus houses DNA, which carries genetic instructions." }, { "q": "What controls what enters and exits the cell?", "options": ["Cell wall", "Nucleus", "Cell membrane", "Ribosome"], "answer": 2, "explanation": "The cell membrane is selectively permeable, controlling substance movement." }, { "q": "What type of cell has no nucleus?", "options": ["Eukaryotic", "Plant cell", "Prokaryotic", "Animal cell"], "answer": 2, "explanation": "Prokaryotic cells (like bacteria) lack a membrane-bound nucleus." }],
  "algebra": [{ "q": "Solve: 2x + 6 = 14", "options": ["x=3", "x=4", "x=5", "x=8"], "answer": 1, "explanation": "2x = 14-6 = 8, so x = 8/2 = 4." }, { "q": "What is the value of 3(x+2) when x=4?", "options": ["14", "18", "12", "15"], "answer": 1, "explanation": "3(4+2) = 3(6) = 18." }, { "q": "Simplify: 5x + 3x - 2x", "options": ["6x", "8x", "10x", "4x"], "answer": 0, "explanation": "5x + 3x - 2x = 6x (combine like terms)." }, { "q": "If y = 2x + 1, what is y when x = 3?", "options": ["5", "7", "9", "6"], "answer": 1, "explanation": "y = 2(3) + 1 = 6 + 1 = 7." }, { "q": "Which is a linear equation?", "options": ["x² + 1 = 5", "2x + 3 = 7", "x³ = 8", "√x = 4"], "answer": 1, "explanation": "A linear equation has a variable with exponent 1, like 2x + 3 = 7." }],
  "electricity": [{ "q": "What is the unit of electrical resistance?", "options": ["Volts", "Amperes", "Ohms", "Watts"], "answer": 2, "explanation": "Resistance is measured in ohms (Ω)." }, { "q": "Ohm's Law states:", "options": ["V=IR", "F=ma", "E=mc²", "P=IV"], "answer": 0, "explanation": "Voltage = Current × Resistance." }, { "q": "In a series circuit, current is:", "options": ["Different at each point", "The same everywhere", "Zero", "Infinite"], "answer": 1, "explanation": "In series, there's only one path so current is the same throughout." }, { "q": "What particle carries electric current in wires?", "options": ["Protons", "Neutrons", "Electrons", "Photons"], "answer": 2, "explanation": "Electrons are the charge carriers that flow through conductors." }, { "q": "What does a battery provide in a circuit?", "options": ["Resistance", "Voltage", "Mass", "Friction"], "answer": 1, "explanation": "A battery provides voltage — the 'push' that drives electrons through the circuit." }],
  "water cycle": [{ "q": "What drives the water cycle?", "options": ["Wind", "The Moon", "The Sun", "Gravity only"], "answer": 2, "explanation": "Solar energy heats water causing evaporation, driving the entire cycle." }, { "q": "What is condensation?", "options": ["Water turning to ice", "Water vapor turning to liquid", "Liquid turning to gas", "Ice turning to gas"], "answer": 1, "explanation": "Condensation is when water vapor cools and becomes liquid droplets, forming clouds." }, { "q": "What is transpiration?", "options": ["Rain falling", "Rivers flowing", "Plants releasing water vapor", "Snow melting"], "answer": 2, "explanation": "Transpiration is water vapor released through plant leaves via stomata." }, { "q": "Where does most evaporation on Earth occur?", "options": ["Lakes", "Rivers", "Oceans", "Soil"], "answer": 2, "explanation": "Oceans cover 71% of Earth and are the primary source of evaporation." }, { "q": "What is precipitation?", "options": ["Water evaporating", "Clouds forming", "Water falling from clouds", "Underground water flow"], "answer": 2, "explanation": "Precipitation includes rain, snow, sleet, and hail falling from clouds." }],
  "dna": [{ "q": "What does DNA stand for?", "options": ["Deoxyribonucleic Acid", "Dynamic Nuclear Acid", "Deoxyribo Nucleic Atom", "Double Nitrogen Acid"], "answer": 0, "explanation": "DNA = Deoxyribonucleic Acid." }, { "q": "Adenine pairs with which base?", "options": ["Guanine", "Cytosine", "Thymine", "Uracil"], "answer": 2, "explanation": "A-T (Adenine-Thymine) and G-C (Guanine-Cytosine) are the base pairing rules." }, { "q": "What is the shape of DNA?", "options": ["Single strand", "Triple helix", "Double helix", "Square lattice"], "answer": 2, "explanation": "DNA has a double helix structure, like a twisted ladder." }, { "q": "Who discovered the structure of DNA?", "options": ["Darwin", "Mendel", "Watson & Crick", "Newton"], "answer": 2, "explanation": "Watson and Crick described the double helix in 1953." }, { "q": "What percentage of DNA do all humans share?", "options": ["50%", "75%", "90%", "99.9%"], "answer": 3, "explanation": "All humans share 99.9% of their DNA sequence." }],
  "fractions": [{ "q": "What is 1/4 + 1/4?", "options": ["1/2", "2/8", "1/8", "2/4"], "answer": 0, "explanation": "1/4 + 1/4 = 2/4 = 1/2." }, { "q": "What is 2/3 × 3/4?", "options": ["5/7", "6/12", "1/2", "2/4"], "answer": 2, "explanation": "2/3 × 3/4 = 6/12 = 1/2." }, { "q": "Which fraction is largest?", "options": ["1/3", "1/4", "1/2", "1/5"], "answer": 2, "explanation": "1/2 = 0.5, which is the largest of the four options." }, { "q": "What is the reciprocal of 3/5?", "options": ["3/5", "5/3", "1/3", "5/1"], "answer": 1, "explanation": "The reciprocal flips the fraction: 3/5 → 5/3." }, { "q": "Simplify 8/12", "options": ["4/6", "2/3", "3/4", "1/2"], "answer": 1, "explanation": "8/12 ÷ 4/4 = 2/3." }],
};

function findOfflineResponse(prompt) {
  const p = prompt.toLowerCase();
  for (const [key, response] of Object.entries(OFFLINE_KB)) {
    if (p.includes(key)) return response;
  }
  return null;
}

function findOfflineQuiz(topic) {
  const t = topic.toLowerCase();
  for (const [key, quiz] of Object.entries(OFFLINE_QUIZZES)) {
    if (t.includes(key) || key.includes(t)) return quiz;
  }
  return null;
}

async function callAI(prompt, system = "", maxTokens = 1400) {
  try {
    const body = { model: "claude-sonnet-4-20250514", max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] };
    if (system) body.system = system;
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify(body)
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
    return d.content.map(b => b.text || "").join("");
  } catch (err) {
    // ── OFFLINE FALLBACK ──
    const offline = findOfflineResponse(prompt);
    if (offline) return offline;
    throw err;
  }
}

/* ═══ SCRIPT LOADER ═══════════════════════════════════════ */
function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

/* ═══ SHARED COMPONENTS ═══════════════════════════════════ */
const Spinner = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 40, gap: 14 }}>
    <div style={{ width: 34, height: 34, border: `2px solid ${T.border2}`, borderTopColor: T.cyan, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    <span style={{ color: T.muted, fontSize: 13, fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 }}>AI Processing…</span>
  </div>
);
const Tag = ({ label, color = T.cyan }) => (<span style={{ background: `${color}18`, border: `1px solid ${color}44`, borderRadius: 4, color, fontSize: 11, padding: "2px 8px", fontWeight: 700, letterSpacing: .5 }}>{label}</span>);
const Card = ({ children, style = {} }) => (<div style={{ background: `${T.surf2}dd`, backdropFilter: "blur(8px)", border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 20px", transition: "border-color .2s", ...style }}>{children}</div>);
const CardTitle = ({ children }) => (<div style={{ color: T.cyan, fontWeight: 700, fontSize: 13, marginBottom: 14, letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 }}>{children}</div>);
const PrimaryBtn = ({ children, onClick, disabled, style = {} }) => (<button onClick={onClick} disabled={disabled} style={{ background: `linear-gradient(135deg,${T.cyanDim},#001e2e)`, border: `1px solid ${T.cyan}88`, borderRadius: 10, color: T.cyan, padding: "11px 20px", fontSize: 14, cursor: "pointer", fontWeight: 700, fontFamily: "Rajdhani,sans-serif", letterSpacing: .5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .2s ease", boxShadow: `0 0 12px ${T.cyan}15`, ...style }} onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 22px ${T.cyan}40`; e.currentTarget.style.borderColor = T.cyan; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 0 12px ${T.cyan}15`; e.currentTarget.style.borderColor = `${T.cyan}88`; }}>{children}</button>);
const Input = ({ value, onChange, placeholder, onKeyDown, style = {} }) => (<input value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown} style={{ background: T.surf2, border: `1px solid ${T.border2}`, borderRadius: 10, color: T.txt, padding: "10px 14px", fontSize: 14, width: "100%", fontFamily: "Rajdhani,sans-serif", transition: "border-color .2s, box-shadow .2s", ...style }} onFocus={e => { e.target.style.borderColor = `${T.cyan}88`; e.target.style.boxShadow = `0 0 10px ${T.cyan}18`; }} onBlur={e => { e.target.style.borderColor = T.border2; e.target.style.boxShadow = "none"; }} />);

/* ═══════════════════════════════════════════════════════════
   PRE-BUILT SVG EDUCATIONAL DIAGRAMS
═══════════════════════════════════════════════════════════ */

/* ── VOLCANO ─────────────────────────────────────────────── */
function VolcanoDiagram() {
  return (
    <svg viewBox="0 0 700 480" style={{ display: "block", width: "100%" }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="magGrd" cx="50%" cy="35%" r="65%"><stop offset="0%" stopColor="#ffdd00" /><stop offset="45%" stopColor="#ff6600" /><stop offset="100%" stopColor="#990000" /></radialGradient>
        <linearGradient id="skyGrd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#050a18" /><stop offset="100%" stopColor="#0d1e35" /></linearGradient>
        <linearGradient id="coneGrd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6a4028" /><stop offset="100%" stopColor="#1e0e06" /></linearGradient>
        <radialGradient id="ashGrd" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#778899" /><stop offset="100%" stopColor="#2a3a4a" /></radialGradient>
        <filter id="vglw"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <marker id="va" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#00d4ff" /></marker>
      </defs>
      <rect width="700" height="480" fill="url(#skyGrd)" />
      <text x="350" y="26" textAnchor="middle" fontFamily="Arial" fontSize="16" fontWeight="bold" fill="#00d4ff" filter="url(#vglw)">VOLCANO CROSS-SECTION</text>
      {/* Ash cloud */}
      <ellipse cx="350" cy="95" rx="88" ry="44" fill="url(#ashGrd)" opacity=".78" />
      <ellipse cx="295" cy="108" rx="62" ry="32" fill="#3a4a5a" opacity=".7" />
      <ellipse cx="405" cy="103" rx="68" ry="35" fill="#334455" opacity=".65" />
      <ellipse cx="350" cy="82" rx="48" ry="28" fill="#667788" opacity=".85" />
      {[-22, -8, 6, 20, -35, 35].map((dx, i) => <circle key={i} cx={350 + dx} cy={98 + (i % 2) * 10 - 5} r="3.5" fill="#889aaa" opacity=".6" />)}
      {/* Eruption jet */}
      <path d="M350,148 L334,60 L342,82 L350,44 L358,82 L366,60 Z" fill="#ff6600" filter="url(#vglw)" opacity=".95" />
      <path d="M350,148 L318,88 L332,95 Z" fill="#ffaa00" opacity=".8" />
      <path d="M350,148 L382,88 L368,95 Z" fill="#ffaa00" opacity=".8" />
      {/* Cone */}
      <polygon points="350,148 130,400 570,400" fill="url(#coneGrd)" />
      <polygon points="350,148 200,400 350,400" fill="rgba(0,0,0,.28)" />
      {/* Snow cap */}
      <polygon points="350,148 322,185 378,185" fill="#ddeeff" opacity=".7" />
      {/* Crater */}
      <ellipse cx="350" cy="150" rx="24" ry="11" fill="#bb2200" stroke="#ff5500" strokeWidth="2" />
      <ellipse cx="350" cy="148" rx="18" ry="8" fill="#991100" />
      {/* Lava flows */}
      <path d="M312,218 Q264,295 242,390" stroke="#ff6600" strokeWidth="8" fill="none" strokeLinecap="round" filter="url(#vglw)" opacity=".9" />
      <path d="M314,222 Q267,298 246,390" stroke="#ffcc00" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".5" />
      <path d="M388,218 Q436,295 458,390" stroke="#ff4400" strokeWidth="7" fill="none" strokeLinecap="round" filter="url(#vglw)" opacity=".85" />
      {/* Central vent */}
      <rect x="342" y="148" width="16" height="188" fill="#881100" opacity=".85" />
      <rect x="346" y="150" width="5" height="185" fill="#ff6600" opacity=".55" />
      {/* Geological layers */}
      {[["#5a3a20", 18], ["#4a502a", 18], ["#382a18", 18], ["#281e10", 20], ["#180e08", 26]].map(([c, h], i) => {
        const y = 400 + [0, 18, 36, 54, 74][i]; return <rect key={i} x="0" y={y} width="700" height={h} fill={c} />;
      })}
      {/* Dike */}
      <path d="M352,336 Q424,356 486,346" stroke="#ff6600" strokeWidth="5" fill="none" opacity=".7" strokeLinecap="round" />
      <path d="M352,400 L426,382 L426,450" stroke="#ff4400" strokeWidth="4" fill="none" opacity=".75" strokeLinecap="round" />
      {/* Magma chamber */}
      <ellipse cx="350" cy="462" rx="200" ry="46" fill="url(#magGrd)" filter="url(#vglw)" />
      <ellipse cx="350" cy="458" rx="160" ry="35" fill="#ffcc00" opacity=".2" />
      <text x="350" y="466" textAnchor="middle" fontFamily="Arial" fontSize="12" fontWeight="bold" fill="#fff">MAGMA CHAMBER</text>
      {/* Labels + lines */}
      {[
        [470, 78, "Ash Cloud", 430, 94],
        [175, 152, "Crater", 325, 152],
        [95, 278, "Lava Flow", 236, 298],
        [490, 208, "Central Vent", 360, 230],
        [555, 408, "Topsoil",],
        [555, 428, "Bedrock",],
        [555, 448, "Lower Crust",],
        [555, 468, "Upper Mantle",],
        [500, 342, "Sill", 484, 348],
        [460, 418, "Dike", 430, 415],
      ].map(([x, y, label, lx, ly]) => (
        <g key={label}>
          <text x={x} y={y} fontFamily="Arial" fontSize="11" fill="#aaccff">{label}</text>
          {lx && <line x1={x - 3} y1={y - 3} x2={lx} y2={ly} stroke="#00d4ff" strokeWidth="1.2" markerEnd="url(#va)" opacity=".8" />}
        </g>
      ))}
    </svg>
  );
}

/* ── PLANT CELL ─────────────────────────────────────────── */
function PlantCellDiagram() {
  return (
    <svg viewBox="0 0 700 480" style={{ display: "block", width: "100%" }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pcBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#050f0a" /><stop offset="100%" stopColor="#091a12" /></linearGradient>
        <radialGradient id="pcCell" cx="48%" cy="52%" r="55%"><stop offset="0%" stopColor="#1a5528" stopOpacity=".55" /><stop offset="100%" stopColor="#0d3318" stopOpacity=".85" /></radialGradient>
        <radialGradient id="pcNuc" cx="40%" cy="40%" r="55%"><stop offset="0%" stopColor="#5566ff" /><stop offset="100%" stopColor="#2233aa" /></radialGradient>
        <radialGradient id="pcVac" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#1188bb" stopOpacity=".4" /><stop offset="100%" stopColor="#0055aa" stopOpacity=".7" /></radialGradient>
        <radialGradient id="pcChlo" cx="40%" cy="40%" r="55%"><stop offset="0%" stopColor="#44dd66" /><stop offset="100%" stopColor="#116622" /></radialGradient>
        <filter id="pcGlw"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <marker id="pca" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#00d4ff" /></marker>
      </defs>
      <rect width="700" height="480" fill="url(#pcBg)" />
      <text x="350" y="26" textAnchor="middle" fontFamily="Arial" fontSize="16" fontWeight="bold" fill="#00ff88" filter="url(#pcGlw)">PLANT CELL STRUCTURE</text>
      {/* Cell wall */}
      <rect x="70" y="44" width="560" height="408" rx="30" fill="none" stroke="#88cc44" strokeWidth="8" opacity=".8" />
      <rect x="78" y="52" width="544" height="392" rx="26" fill="none" stroke="#66aa33" strokeWidth="3" opacity=".5" />
      {/* Cell membrane */}
      <rect x="88" y="62" width="524" height="372" rx="22" fill="url(#pcCell)" stroke="#44aa66" strokeWidth="2" opacity=".9" />
      {/* Large central vacuole */}
      <rect x="160" y="110" width="280" height="250" rx="40" fill="url(#pcVac)" stroke="#2299cc" strokeWidth="2" />
      <text x="300" y="240" textAnchor="middle" fontFamily="Arial" fontSize="13" fill="#88ddff" fontWeight="bold">Central</text>
      <text x="300" y="257" textAnchor="middle" fontFamily="Arial" fontSize="13" fill="#88ddff" fontWeight="bold">Vacuole</text>
      {/* Nucleus */}
      <ellipse cx="500" cy="185" rx="72" ry="58" fill="url(#pcNuc)" stroke="#8899ff" strokeWidth="3" filter="url(#pcGlw)" />
      <ellipse cx="500" cy="185" rx="58" ry="44" fill="none" stroke="#aabbff" strokeWidth="1.5" strokeDasharray="4,3" opacity=".6" />
      <ellipse cx="494" cy="178" rx="20" ry="16" fill="#ccddff" opacity=".7" />
      <text x="500" y="246" textAnchor="middle" fontFamily="Arial" fontSize="11" fill="#aabbff">Nucleus</text>
      {/* Chloroplasts */}
      {[[120, 120, 0], [130, 200, 15], [125, 295, -10], [480, 310, 8], [560, 260, 20], [545, 340, -12]].map(([cx, cy, rot], i) => (
        <g key={i} transform={`translate(${cx},${cy}) rotate(${rot})`}>
          <ellipse rx="28" ry="16" fill="url(#pcChlo)" stroke="#22ee66" strokeWidth="1.5" />
          {[-12, -4, 4, 12].map(gx => <line key={gx} x1={gx} y1="-11" x2={gx} y2="11" stroke="#00cc44" strokeWidth="1" opacity=".7" />)}
          <text x="0" y="26" textAnchor="middle" fontFamily="Arial" fontSize="9" fill="#88ffaa">{i === 0 ? "Chloroplast" : ""}</text>
        </g>
      ))}
      {/* Mitochondria */}
      {[[480, 100, 0], [560, 155, 25], [510, 370, -15], [130, 380, 10]].map(([cx, cy, rot], i) => (
        <g key={i} transform={`translate(${cx},${cy}) rotate(${rot})`}>
          <ellipse rx="22" ry="13" fill="#cc6622" stroke="#ff8833" strokeWidth="1.5" opacity=".85" />
          <path d="M-15,0 Q-8,-8 0,-2 Q8,6 15,0" stroke="#ffaa55" strokeWidth="1.5" fill="none" />
          <text x="0" y="22" textAnchor="middle" fontFamily="Arial" fontSize="9" fill="#ffaa55">{i === 0 ? "Mitochondria" : ""}</text>
        </g>
      ))}
      {/* Endoplasmic reticulum */}
      <path d="M448,320 Q475,340 460,365 Q445,380 480,395 Q510,410 490,430" stroke="#ffdd88" strokeWidth="2.5" fill="none" opacity=".7" strokeLinecap="round" />
      {/* Golgi apparatus */}
      {[0, 6, 12, 18, 24].map(i => (
        <path key={i} d={`M${560 + i * 2},${305 + i * 1.5} Q${590 + i * 2},${315 + i * 1.5} ${560 + i * 2},${325 + i * 1.5}`} stroke="#ff88ff" strokeWidth="2" fill="none" opacity={.9 - i * .12} />
      ))}
      {/* Ribosomes */}
      {[[200, 100], [220, 95], [180, 105], [460, 290], [440, 300], [480, 285], [550, 190], [565, 200]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="4" fill="#ffdd44" opacity=".8" />
      ))}
      {/* Labels */}
      {[
        [30, 55, "Cell Wall", 88, 70],
        [30, 80, "Cell Membrane", 88, 80],
        [20, 240, "Central Vacuole", 160, 235],
        [548, 185, "Nucleus", 428, 185],
        [548, 105, "Chloroplast", 150, 125],
        [548, 250, "Mitochondria", 500, 100],
        [548, 290, "Golgi Apparatus", 555, 315],
        [548, 325, "Endoplasmic", 495, 355],
        [548, 340, "Reticulum", 495, 365],
        [548, 365, "Ribosomes", 460, 290],
      ].map(([x, y, label, lx, ly]) => (
        <g key={label}>
          <text x={x} y={y} fontFamily="Arial" fontSize="10" fill="#aaccff">{label}</text>
          {lx && <line x1={x + label.length * 5.5} y1={y - 3} x2={lx} y2={ly} stroke="#00d4ff" strokeWidth="1" markerEnd="url(#pca)" opacity=".7" />}
        </g>
      ))}
    </svg>
  );
}

/* ── WATER CYCLE ─────────────────────────────────────────── */
function WaterCycleDiagram() {
  return (
    <svg viewBox="0 0 700 480" style={{ display: "block", width: "100%" }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wcSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#020818" /><stop offset="60%" stopColor="#0a2040" /><stop offset="100%" stopColor="#0d3060" /></linearGradient>
        <linearGradient id="wcSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1155aa" /><stop offset="100%" stopColor="#082255" /></linearGradient>
        <linearGradient id="wcMtn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ccddee" /><stop offset="30%" stopColor="#889aaa" /><stop offset="100%" stopColor="#44556a" /></linearGradient>
        <radialGradient id="wcSun" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#ffff88" /><stop offset="60%" stopColor="#ffcc00" /><stop offset="100%" stopColor="#ff8800" /></radialGradient>
        <filter id="wcGlw"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <marker id="wca" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#00d4ff" /></marker>
        <marker id="wcao" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#ffaa00" /></marker>
        <marker id="wcab" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#44aaff" /></marker>
      </defs>
      <rect width="700" height="480" fill="url(#wcSky)" />
      <text x="350" y="24" textAnchor="middle" fontFamily="Arial" fontSize="16" fontWeight="bold" fill="#00d4ff" filter="url(#wcGlw)">THE WATER CYCLE</text>
      {/* Sun */}
      <circle cx="88" cy="72" r="38" fill="url(#wcSun)" filter="url(#wcGlw)" />
      <circle cx="88" cy="72" r="48" fill="none" stroke="#ffcc00" strokeWidth="1.5" strokeDasharray="6,5" opacity=".5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
        const r = Math.PI * deg / 180; return <line key={deg} x1={88 + 52 * Math.cos(r)} y1={72 + 52 * Math.sin(r)} x2={88 + 62 * Math.cos(r)} y2={72 + 62 * Math.sin(r)} stroke="#ffcc00" strokeWidth="2.5" opacity=".7" />;
      })}
      {/* Mountains */}
      <polygon points="400,350 500,180 600,350" fill="url(#wcMtn)" stroke="#667788" strokeWidth="1" />
      <polygon points="460,350 540,220 620,350" fill="url(#wcMtn)" stroke="#667788" strokeWidth="1" />
      <polygon points="420,350 510,165 590,350" fill="#667888" opacity=".5" />
      <polygon points="490,180 510,165 530,200" fill="#ddeeff" opacity=".9" />
      <polygon points="500,220 540,220 520,200" fill="#ddeeff" opacity=".7" />
      {/* Ground */}
      <rect x="0" y="350" width="700" height="130" fill="#1a3a1a" />
      <rect x="0" y="350" width="700" height="12" fill="#2a5a2a" />
      {/* Ocean / lake */}
      <path d="M0,350 Q60,335 120,350 Q180,365 240,350 Q300,335 360,350 L360,390 L0,390 Z" fill="url(#wcSea)" opacity=".9" />
      <path d="M0,352 Q60,340 120,352 Q180,364 240,352 Q300,340 360,352" stroke="#4488ff" strokeWidth="1.5" fill="none" opacity=".6" />
      <text x="180" y="378" textAnchor="middle" fontFamily="Arial" fontSize="13" fill="#88aaff" fontWeight="bold">OCEAN</text>
      {/* River */}
      <path d="M510,340 Q475,355 440,365 Q400,372 360,355" stroke="#4488ff" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".8" />
      <path d="M510,340 Q475,358 440,368 Q400,375 360,358" stroke="#88ccff" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".5" />
      {/* Underground water */}
      <path d="M80,420 Q200,415 360,420 Q480,425 600,418" stroke="#4466aa" strokeWidth="2" fill="none" strokeDasharray="8,4" opacity=".6" />
      <path d="M80,440 Q200,435 360,440 Q480,445 600,438" stroke="#4466aa" strokeWidth="1.5" fill="none" strokeDasharray="8,4" opacity=".4" />
      <text x="350" y="458" textAnchor="middle" fontFamily="Arial" fontSize="10" fill="#4488aa">Groundwater Flow</text>
      {/* Clouds */}
      {[[260, 78], [380, 62], [480, 88]].map(([cx, cy], ci) => (
        <g key={ci}>
          <ellipse cx={cx} cy={cy} rx="52" ry="26" fill="#334455" opacity=".85" />
          <ellipse cx={cx - 22} cy={cy + 5} rx="36" ry="20" fill="#445566" opacity=".75" />
          <ellipse cx={cx + 22} cy={cy + 4} rx="40" ry="22" fill="#3a4e62" opacity=".8" />
          <ellipse cx={cx} cy={cy - 6} rx="32" ry="20" fill="#556677" opacity=".9" />
          {ci === 1 && [...Array(6)].map((_, i) => (
            <line key={i} x1={cx - 20 + i * 8} y1={cy + 22} x2={cx - 22 + i * 8} y2={cy + 40} stroke="#88ccff" strokeWidth="2" opacity=".7" strokeLinecap="round" />
          ))}
        </g>
      ))}
      {/* Evaporation arrows */}
      {[60, 100, 140, 180, 220, 260].map((x, i) => (
        <line key={i} x1={x} y1={340 - i % 2 * 8} x2={x + i % 2 * 4 + 6} y2={260} stroke="#ffaa00" strokeWidth="1.8" markerEnd="url(#wcao)" opacity=".7" strokeDasharray="5,3" />
      ))}
      {/* Condensation arrows */}
      <path d="M300,85 Q280,100 265,88" stroke="#00d4ff" strokeWidth="2" fill="none" markerEnd="url(#wca)" opacity=".8" />
      {/* Wind / transport */}
      <path d="M308,72 Q340,58 378,64" stroke="#ffffff" strokeWidth="2.5" fill="none" markerEnd="url(#wca)" opacity=".55" strokeDasharray="6,3" />
      {/* Precipitation */}
      {[255, 265, 275, 260, 270].map((x, i) => (
        <line key={i} x1={x} y1={92 + i * 4} x2={x + i % 2 * 3 - 1} y2={115 + i * 4} stroke="#88ccff" strokeWidth="2.2" opacity=".8" strokeLinecap="round" />
      ))}
      {/* Runoff arrow */}
      <path d="M520,338 Q440,350 365,356" stroke="#44aaff" strokeWidth="3" fill="none" markerEnd="url(#wcab)" opacity=".85" />
      {/* Transpiration from trees */}
      <g transform="translate(455,320)">
        <rect x="-4" y="0" width="8" height="22" fill="#552200" />
        <circle cy="-18" r="22" fill="#226622" opacity=".9" />
        <circle cx="-14" cy="-10" r="16" fill="#336633" opacity=".7" />
        <circle cx="14" cy="-10" r="16" fill="#336633" opacity=".7" />
      </g>
      <line x1="455" y1="300" x2="438" y2="270" stroke="#88dd66" strokeWidth="2" markerEnd="url(#wcao)" opacity=".6" strokeDasharray="4,3" />
      {/* Labels */}
      {[
        [40, 290, "Evaporation"],
        [190, 50, "Condensation"],
        [360, 38, "Wind Transport"],
        [232, 130, "Precipitation"],
        [408, 335, "Surface Runoff"],
        [430, 300, "Transpiration"],
        [40, 72, "Sun"],
      ].map(([x, y, label]) => (
        <text key={label} x={x} y={y} fontFamily="Arial" fontSize="11" fill="#aaccff" textAnchor="middle">{label}</text>
      ))}
    </svg>
  );
}

/* ── HUMAN HEART ─────────────────────────────────────────── */
function HeartDiagram() {
  return (
    <svg viewBox="0 0 700 480" style={{ display: "block", width: "100%" }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#080410" /><stop offset="100%" stopColor="#120818" /></linearGradient>
        <radialGradient id="hRA" cx="50%" cy="50%" r="55%"><stop offset="0%" stopColor="#4466aa" /><stop offset="100%" stopColor="#223388" /></radialGradient>
        <radialGradient id="hLA" cx="50%" cy="50%" r="55%"><stop offset="0%" stopColor="#cc3333" /><stop offset="100%" stopColor="#881111" /></radialGradient>
        <radialGradient id="hRV" cx="50%" cy="50%" r="55%"><stop offset="0%" stopColor="#3355bb" /><stop offset="100%" stopColor="#1a2a88" /></radialGradient>
        <radialGradient id="hLV" cx="50%" cy="50%" r="55%"><stop offset="0%" stopColor="#dd2222" /><stop offset="100%" stopColor="#991111" /></radialGradient>
        <filter id="hglw"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <marker id="ha" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#ff4444" /></marker>
        <marker id="hb" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#4488ff" /></marker>
        <marker id="ha2" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#00d4ff" /></marker>
      </defs>
      <rect width="700" height="480" fill="url(#hbg)" />
      <text x="350" y="26" textAnchor="middle" fontFamily="Arial" fontSize="16" fontWeight="bold" fill="#ff6666" filter="url(#hglw)">HUMAN HEART ANATOMY</text>
      {/* Pericardium outline */}
      <path d="M220,60 Q180,80 160,140 Q140,200 145,280 Q150,360 240,410 Q290,440 350,450 Q410,440 460,410 Q550,360 555,280 Q560,200 540,140 Q520,80 480,60 Q430,45 350,48 Q280,45 220,60 Z"
        fill="none" stroke="#cc4444" strokeWidth="2.5" strokeDasharray="8,4" opacity=".5" />
      {/* Right Atrium */}
      <ellipse cx="268" cy="165" rx="75" ry="65" fill="url(#hRA)" stroke="#6688cc" strokeWidth="2" filter="url(#hglw)" opacity=".9" />
      <text x="268" y="160" textAnchor="middle" fontFamily="Arial" fontSize="11" fill="#aaccff" fontWeight="bold">Right</text>
      <text x="268" y="174" textAnchor="middle" fontFamily="Arial" fontSize="11" fill="#aaccff" fontWeight="bold">Atrium</text>
      {/* Left Atrium */}
      <ellipse cx="432" cy="165" rx="75" ry="65" fill="url(#hLA)" stroke="#cc6666" strokeWidth="2" filter="url(#hglw)" opacity=".9" />
      <text x="432" y="160" textAnchor="middle" fontFamily="Arial" fontSize="11" fill="#ffcccc" fontWeight="bold">Left</text>
      <text x="432" y="174" textAnchor="middle" fontFamily="Arial" fontSize="11" fill="#ffcccc" fontWeight="bold">Atrium</text>
      {/* Right Ventricle */}
      <path d="M208,228 Q180,280 195,340 Q215,400 288,418 Q340,430 350,428 L350,228 Z" fill="url(#hRV)" stroke="#5577cc" strokeWidth="2" filter="url(#hglw)" opacity=".9" />
      <text x="265" y="320" textAnchor="middle" fontFamily="Arial" fontSize="11" fill="#aabbff" fontWeight="bold">Right</text>
      <text x="265" y="334" textAnchor="middle" fontFamily="Arial" fontSize="11" fill="#aabbff" fontWeight="bold">Ventricle</text>
      {/* Left Ventricle */}
      <path d="M492,228 Q520,280 505,340 Q485,400 412,418 Q360,430 350,428 L350,228 Z" fill="url(#hLV)" stroke="#cc5555" strokeWidth="2" filter="url(#hglw)" opacity=".9" />
      <text x="432" y="320" textAnchor="middle" fontFamily="Arial" fontSize="11" fill="#ffaaaa" fontWeight="bold">Left</text>
      <text x="432" y="334" textAnchor="middle" fontFamily="Arial" fontSize="11" fill="#ffaaaa" fontWeight="bold">Ventricle</text>
      {/* Septum */}
      <line x1="350" y1="120" x2="350" y2="428" stroke="#222" strokeWidth="6" opacity=".7" />
      <line x1="350" y1="120" x2="350" y2="428" stroke="#ff8888" strokeWidth="2" opacity=".5" strokeDasharray="6,4" />
      {/* Tricuspid valve */}
      <path d="M310,228 Q350,218 388,228" stroke="#ffdd66" strokeWidth="3" fill="none" />
      {/* Mitral valve */}
      <path d="M312,232 Q350,244 386,232" stroke="#ffdd66" strokeWidth="3" fill="none" />
      {/* Pulmonary valve indicator */}
      <circle cx="295" cy="116" r="8" fill="#ffdd66" opacity=".8" />
      {/* Aortic valve indicator */}
      <circle cx="408" cy="116" r="8" fill="#ffdd66" opacity=".8" />
      {/* Aorta */}
      <path d="M432,100 Q432,52 480,38 Q530,24 560,50 Q590,75 565,110" stroke="#dd3333" strokeWidth="12" fill="none" strokeLinecap="round" filter="url(#hglw)" />
      <path d="M432,100 Q432,52 480,38 Q530,24 560,50 Q590,75 565,110" stroke="#ff6666" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".6" />
      {/* Superior Vena Cava */}
      <path d="M268,100 L268,52 L268,40" stroke="#4466bb" strokeWidth="12" fill="none" strokeLinecap="round" />
      <path d="M268,100 L268,52 L268,40" stroke="#88aaff" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".5" />
      {/* Inferior Vena Cava */}
      <path d="M228,415 Q214,440 215,460" stroke="#4466bb" strokeWidth="11" fill="none" strokeLinecap="round" />
      <path d="M228,415 Q214,440 215,460" stroke="#88aaff" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".5" />
      {/* Pulmonary Artery */}
      <path d="M296,100 Q270,52 244,44 Q220,36 200,52" stroke="#5577cc" strokeWidth="10" fill="none" strokeLinecap="round" />
      {/* Pulmonary Veins */}
      <path d="M472,100 Q496,60 520,55 Q545,52 558,65" stroke="#cc3333" strokeWidth="9" fill="none" strokeLinecap="round" />
      {/* Blood flow arrows */}
      <path d="M350,228 L350,420" stroke="none" />
      {/* Labels + lines */}
      {[
        [80, 36, "Superior Vena Cava", 268, 52],
        [565, 30, "Aorta", 490, 44],
        [100, 450, "Inferior Vena Cava", 215, 446],
        [140, 72, "Pulmonary Artery", 245, 60],
        [555, 68, "Pulmonary Veins", 525, 60],
        [580, 165, "Tricuspid Valve", 388, 232],
        [580, 220, "Mitral Valve", 387, 234],
      ].map(([x, y, label, lx, ly]) => (
        <g key={label}>
          <text x={x} y={y} fontFamily="Arial" fontSize="10.5" fill="#ffccaa">{label}</text>
          {lx && <line x1={x + label.length * 5} y1={y - 4} x2={lx} y2={ly} stroke="#00d4ff" strokeWidth="1.2" markerEnd="url(#ha2)" opacity=".75" />}
        </g>
      ))}
      {/* Legend */}
      <rect x="570" y="380" width="120" height="70" rx="8" fill="#0a1020" stroke="#334455" strokeWidth="1" />
      <rect x="578" y="392" width="12" height="12" rx="2" fill="#4466bb" />
      <text x="596" y="402" fontFamily="Arial" fontSize="10" fill="#aabbff">Deoxygenated</text>
      <rect x="578" y="412" width="12" height="12" rx="2" fill="#cc3333" />
      <text x="596" y="422" fontFamily="Arial" fontSize="10" fill="#ffaaaa">Oxygenated</text>
      <text x="630" y="440" textAnchor="middle" fontFamily="Arial" fontSize="9" fill="#667788">Blood</text>
    </svg>
  );
}

/* ── BOHR ATOM ───────────────────────────────────────────── */
function AtomDiagram() {
  const shells = [[2, 52], [8, 105], [8, 158], [2, 210]];
  return (
    <svg viewBox="0 0 700 480" style={{ display: "block", width: "100%" }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="abg" cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor="#0a0520" /><stop offset="100%" stopColor="#030810" /></radialGradient>
        <radialGradient id="aNuc" cx="40%" cy="40%" r="55%"><stop offset="0%" stopColor="#ff8800" /><stop offset="60%" stopColor="#cc4400" /><stop offset="100%" stopColor="#881100" /></radialGradient>
        <radialGradient id="aP" cx="40%" cy="40%" r="55%"><stop offset="0%" stopColor="#ff6644" /><stop offset="100%" stopColor="#cc2200" /></radialGradient>
        <radialGradient id="aN" cx="40%" cy="40%" r="55%"><stop offset="0%" stopColor="#aabb88" /><stop offset="100%" stopColor="#667744" /></radialGradient>
        <radialGradient id="aE" cx="40%" cy="40%" r="55%"><stop offset="0%" stopColor="#44ddff" /><stop offset="100%" stopColor="#0088cc" /></radialGradient>
        <filter id="aglw"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="aglw2"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <marker id="aa" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#00d4ff" /></marker>
      </defs>
      <rect width="700" height="480" fill="url(#abg)" />
      {/* Background star particles */}
      {Array.from({ length: 40 }, (_, i) => <circle key={i} cx={(i * 173 + 50) % 680 + 10} cy={(i * 251 + 30) % 440 + 20} r={(i % 3) + 1} fill="#ffffff" opacity={.1 + .15 * (i % 3)} />)}
      <text x="350" y="26" textAnchor="middle" fontFamily="Arial" fontSize="16" fontWeight="bold" fill="#44ddff" filter="url(#aglw)">ATOMIC STRUCTURE — BOHR MODEL</text>
      {/* Electron shells */}
      {shells.map(([, r], i) => (
        <circle key={i} cx="350" cy="250" r={r} fill="none" stroke={`hsl(${200 + i * 18},80%,55%)`} strokeWidth="1.5" strokeDasharray="6,4" opacity=".6" />
      ))}
      {/* Shell labels */}
      {shells.map(([n, r], i) => (
        <text key={i} x={350 + r + 8} y={254} fontFamily="Arial" fontSize="10" fill={`hsl(${200 + i * 18},80%,70%)`} opacity=".8">n={i + 1}</text>
      ))}
      {/* Nucleus */}
      <circle cx="350" cy="250" r="42" fill="url(#aNuc)" filter="url(#aglw)" stroke="#ff8800" strokeWidth="2" />
      {/* Protons and neutrons in nucleus */}
      {[[-14, -14], [14, -14], [0, 0], [-14, 14], [14, 14], [0, -14], [0, 14], [-7, 0], [7, 0], [-7, -7], [7, 7], [7, -7], [-7, 7]].map(([x, y], i) => (
        <circle key={i} cx={350 + x} cy={250 + y} r="8.5"
          fill={i % 2 === 0 ? "url(#aP)" : "url(#aN)"} stroke={i % 2 === 0 ? "#ff5500" : "#889944"} strokeWidth=".8"
          filter="url(#aglw2)" />
      ))}
      <text x="350" y="254" textAnchor="middle" fontFamily="Arial" fontSize="10" fill="#fff" fontWeight="bold">NUCLEUS</text>
      {/* Electrons */}
      {shells.map(([count, r], si) => {
        return Array.from({ length: count }, (_, ei) => {
          const angle = (ei / count) * Math.PI * 2 - Math.PI / 2 + si * .3;
          const ex = 350 + r * Math.cos(angle), ey = 250 + r * Math.sin(angle);
          return (
            <g key={`e${si}-${ei}`}>
              <circle cx={ex} cy={ey} r="9" fill="url(#aE)" filter="url(#aglw2)" stroke="#00ccff" strokeWidth="1.2" />
              <text x={ex} y={ey + 4} textAnchor="middle" fontFamily="Arial" fontSize="10" fill="#fff" fontWeight="bold">e⁻</text>
            </g>
          );
        });
      })}
      {/* Proton/Neutron legend */}
      <rect x="28" y="390" width="160" height="70" rx="8" fill="#080c18" stroke="#1a2a44" strokeWidth="1" />
      <circle cx="48" cy="408" r="9" fill="url(#aP)" />
      <text x="64" y="412" fontFamily="Arial" fontSize="11" fill="#ff8888">Proton (+)</text>
      <circle cx="48" cy="430" r="9" fill="url(#aN)" />
      <text x="64" y="434" fontFamily="Arial" fontSize="11" fill="#aabb88">Neutron (0)</text>
      <circle cx="48" cy="452" r="9" fill="url(#aE)" />
      <text x="64" y="456" fontFamily="Arial" fontSize="11" fill="#44ddff">Electron (−)</text>
      {/* Labels */}
      {[
        [520, 190, "Nucleus", 351, 213],
        [520, 250, "1st Shell (n=1)", 350 + 52, 250],
        [520, 290, "2nd Shell (n=2)", 350 + 105, 250],
        [520, 330, "3rd Shell (n=3)", 350 + 158, 250],
        [520, 370, "4th Shell (n=4)", 350 + 210, 250],
        [200, 140, "Electron Orbital", 350 - 80, 215],
      ].map(([x, y, label, lx, ly]) => (
        <g key={label}>
          <text x={x} y={y} fontFamily="Arial" fontSize="11" fill="#aaccff">{label}</text>
          <line x1={x - 4} y1={y - 4} x2={lx} y2={ly} stroke="#00d4ff" strokeWidth="1" markerEnd="url(#aa)" opacity=".7" />
        </g>
      ))}
      {/* Element label */}
      <text x="350" y="465" textAnchor="middle" fontFamily="Arial" fontSize="13" fill="#88aabb">Example: Sodium (Na) — Atomic No. 11 — 2, 8, 1 electron configuration</text>
    </svg>
  );
}

/* ── ELECTRIC CIRCUIT ───────────────────────────────────── */
function CircuitDiagram() {
  return (
    <svg viewBox="0 0 700 480" style={{ display: "block", width: "100%" }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#040c08" /><stop offset="100%" stopColor="#081410" /></linearGradient>
        <radialGradient id="cBulb" cx="50%" cy="45%" r="55%"><stop offset="0%" stopColor="#ffff88" /><stop offset="60%" stopColor="#ffaa00" /><stop offset="100%" stopColor="#cc5500" /></radialGradient>
        <filter id="cglw"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="cglw2"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <marker id="ce" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto"><polygon points="0 0,10 4,0 8" fill="#ffdd00" /></marker>
        <marker id="ca" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#00d4ff" /></marker>
      </defs>
      <rect width="700" height="480" fill="url(#cbg)" />
      {/* Grid dots */}
      {Array.from({ length: 20 }, (_, row) => Array.from({ length: 28 }, (_, col) => (
        <circle key={`${row}-${col}`} cx={col * 25 + 12} cy={row * 24 + 12} r="1" fill="#1a3020" opacity=".5" />
      )))}
      <text x="350" y="26" textAnchor="middle" fontFamily="Arial" fontSize="16" fontWeight="bold" fill="#00ff88" filter="url(#cglw)">ELECTRIC CIRCUIT DIAGRAM</text>
      {/* Main circuit wire (rectangle path) */}
      {[
        { x1: 140, y1: 150, x2: 560, y2: 150 }, { x1: 560, y1: 150, x2: 560, y2: 350 },
        { x1: 560, y1: 350, x2: 140, y2: 350 }, { x1: 140, y1: 350, x2: 140, y2: 150 }
      ].map(({ x1, y1, x2, y2 }, i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#00ff44" strokeWidth="4" opacity=".7" />
      ))}
      {/* BATTERY at left */}
      <g transform="translate(140,250)">
        <rect x="-18" y="-55" width="36" height="110" rx="6" fill="#1a2a1a" stroke="#33aa44" strokeWidth="2" />
        {[-30, -18, -6, 6, 18, 30].map((y, i) => (
          <line key={i} x1={i % 2 ? -14 : -18} y1={y} x2={i % 2 ? 14 : 18} y2={y} stroke={i % 2 ? "#ff4444" : "#4444ff"} strokeWidth={i % 2 ? 4 : 2.5} />
        ))}
        <text x="0" y="-62" textAnchor="middle" fontFamily="Arial" fontSize="12" fill="#88cc88">+</text>
        <text x="0" y="72" textAnchor="middle" fontFamily="Arial" fontSize="12" fill="#88cc88">−</text>
        <text x="42" y="4" fontFamily="Arial" fontSize="12" fill="#88cc88" fontWeight="bold">9V</text>
      </g>
      {/* SWITCH top-left area */}
      <g transform="translate(280,150)">
        <circle cx="-28" cy="0" r="6" fill="#33aa44" stroke="#00ff44" strokeWidth="1.5" />
        <circle cx="28" cy="0" r="6" fill="#33aa44" stroke="#00ff44" strokeWidth="1.5" />
        <line x1="-22" y1="0" x2="24" y2="-22" stroke="#00ff44" strokeWidth="3.5" strokeLinecap="round" />
        <text x="0" y="-32" textAnchor="middle" fontFamily="Arial" fontSize="11" fill="#88cc88">Switch</text>
      </g>
      {/* RESISTOR bottom */}
      <g transform="translate(350,350)">
        <rect x="-50" y="-12" width="100" height="24" rx="4" fill="#1a2010" stroke="#ffaa00" strokeWidth="2" />
        {[-35, -21, -7, 7, 21, 35].map((x, i) => (
          <rect key={i} x={x - 5} y="-9" width="10" height="18" rx="2" fill={`hsl(${i * 30 + 20},70%,45%)`} opacity=".8" />
        ))}
        <text x="0" y="-20" textAnchor="middle" fontFamily="Arial" fontSize="11" fill="#ffaa66">Resistor (10Ω)</text>
      </g>
      {/* LIGHT BULB */}
      <g transform="translate(560,250)" filter="url(#cglw)">
        <circle cy="-12" r="32" fill="url(#cBulb)" stroke="#ffcc44" strokeWidth="2.5" />
        <line x1="-10" y1="12" x2="-10" y2="28" stroke="#888" strokeWidth="4" />
        <line x1="10" y1="12" x2="10" y2="28" stroke="#888" strokeWidth="4" />
        <rect x="-14" y="28" width="28" height="8" rx="3" fill="#556655" stroke="#888" strokeWidth="1.5" />
        <path d="M-10,-10 Q0,-26 10,-10" stroke="#ffffff" strokeWidth="2" fill="none" opacity=".8" />
        <text x="0" y="50" textAnchor="middle" fontFamily="Arial" fontSize="12" fill="#ffcc88">Bulb</text>
        {/* Glow rays */}
        {[0, 30, 60, 90, 120, 150, 210, 240, 270, 300, 330].map((deg, i) => {
          const r = Math.PI * deg / 180;
          return <line key={i} x1={36 * Math.cos(r)} y1={-12 + 36 * Math.sin(r)} x2={48 * Math.cos(r)} y2={-12 + 48 * Math.sin(r)} stroke="#ffdd44" strokeWidth="2" opacity=".5" />;
        })}
      </g>
      {/* AMMETER */}
      <g transform="translate(350,150)">
        <circle r="22" fill="#0a1820" stroke="#00aaff" strokeWidth="2.5" />
        <text x="0" y="5" textAnchor="middle" fontFamily="Arial" fontSize="16" fill="#00aaff" fontWeight="bold">A</text>
        <text x="0" y="-30" textAnchor="middle" fontFamily="Arial" fontSize="11" fill="#88aaff">Ammeter</text>
      </g>
      {/* Electron flow arrows on wires */}
      {[[200, 150, 260, 150], [390, 150, 450, 150], [560, 200, 560, 280], [560, 300, 560, 340], [490, 350, 420, 350], [300, 350, 220, 350], [140, 300, 140, 220], [140, 200, 140, 170]].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="20" markerEnd="url(#ce)" />
      ))}
      {/* Energy labels */}
      {[
        [42, 250, "Battery\n(EMF Source)"],
        [100, 90, "Current Direction →"],
        [620, 95, "Load (Bulb)"],
      ].map(([x, y, label]) => (
        <text key={label} x={x} y={y} fontFamily="Arial" fontSize="11" fill="#aaccff">{label.split("\n").map((l, i) => <tspan key={i} x={x} dy={i ? 14 : 0}>{l}</tspan>)}</text>
      ))}
      {/* Voltage indicators */}
      <text x="80" y="300" fontFamily="Arial" fontSize="12" fill="#ff8888">+</text>
      <text x="80" y="220" fontFamily="Arial" fontSize="12" fill="#4488ff">−</text>
      {/* Formula box */}
      <rect x="220" y="380" width="260" height="60" rx="10" fill="#0a1810" stroke="#334433" strokeWidth="1.5" />
      <text x="350" y="403" textAnchor="middle" fontFamily="Arial" fontSize="13" fill="#00ff88" fontWeight="bold">Ohm's Law: V = I × R</text>
      <text x="350" y="425" textAnchor="middle" fontFamily="Arial" fontSize="11" fill="#88aa88">Voltage = Current × Resistance</text>
    </svg>
  );
}

/* ── PHOTOSYNTHESIS ──────────────────────────────────────── */
function PhotosynthesisDiagram() {
  return (
    <svg viewBox="0 0 700 480" style={{ display: "block", width: "100%" }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#061208" /><stop offset="100%" stopColor="#041008" /></linearGradient>
        <radialGradient id="pSun" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#ffffaa" /><stop offset="60%" stopColor="#ffcc00" /><stop offset="100%" stopColor="#ff8800" /></radialGradient>
        <linearGradient id="pLeaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2a8c2a" /><stop offset="100%" stopColor="#115511" /></linearGradient>
        <linearGradient id="pChlo" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#33cc44" /><stop offset="100%" stopColor="#116622" /></linearGradient>
        <filter id="pglw"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <marker id="pao" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#ffcc00" /></marker>
        <marker id="pab" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#4488ff" /></marker>
        <marker id="pag" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#44ff88" /></marker>
        <marker id="par" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#ff6644" /></marker>
      </defs>
      <rect width="700" height="480" fill="url(#pbg)" />
      <text x="350" y="26" textAnchor="middle" fontFamily="Arial" fontSize="16" fontWeight="bold" fill="#44ff88" filter="url(#pglw)">PHOTOSYNTHESIS PROCESS</text>
      {/* Sun */}
      <circle cx="88" cy="80" r="42" fill="url(#pSun)" filter="url(#pglw)" />
      {[0, 40, 80, 120, 160, 200, 240, 280, 320].map(deg => {
        const r = Math.PI * deg / 180; return <line key={deg} x1={88 + 48 * Math.cos(r)} y1={80 + 48 * Math.sin(r)} x2={88 + 60 * Math.cos(r)} y2={80 + 60 * Math.sin(r)} stroke="#ffcc00" strokeWidth="2.5" opacity=".65" />;
      })}
      <text x="88" y="140" textAnchor="middle" fontFamily="Arial" fontSize="11" fill="#ffdd66">Sunlight</text>
      {/* Main leaf */}
      <path d="M240,130 Q350,70 460,130 Q500,180 480,260 Q440,340 350,370 Q260,340 220,260 Q200,180 240,130 Z" fill="url(#pLeaf)" stroke="#44cc44" strokeWidth="3" />
      {/* Leaf veins */}
      <path d="M350,130 L350,365" stroke="#226622" strokeWidth="3" opacity=".6" />
      {["M350,200 Q310,220 280,210", "M350,200 Q390,220 420,210", "M350,260 Q305,285 270,268", "M350,260 Q395,285 430,268", "M350,310 Q315,335 288,318", "M350,310 Q385,335 412,318"].map((d, i) => (
        <path key={i} d={d} stroke="#226622" strokeWidth="2" fill="none" opacity=".5" />
      ))}
      {/* Stomata */}
      {[[300, 348, 8], [350, 360, 10], [400, 350, 8]].map(([x, y, r], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx={r} ry={r / 2} fill="none" stroke="#44cc44" strokeWidth="1.5" />
          <ellipse cx={x} cy={y} rx={r * .55} ry={r * .25} fill="#1a4a1a" />
        </g>
      ))}
      {/* Chloroplast detail (zoomed inset) */}
      <rect x="510" y="60" width="172" height="130" rx="10" fill="#050e08" stroke="#22aa44" strokeWidth="1.5" />
      <text x="596" y="80" textAnchor="middle" fontFamily="Arial" fontSize="10" fill="#44ff88">Chloroplast (Zoom)</text>
      <ellipse cx="596" cy="130" rx="65" ry="38" fill="url(#pChlo)" stroke="#22cc44" strokeWidth="2" />
      {[0, 1, 2, 3, 4].map(i => (
        <ellipse key={i} cx={555 + i * 18} cy="130" rx="7" ry="17" fill="#115522" stroke="#33aa44" strokeWidth="1" opacity=".8" />
      ))}
      <text x="596" y="163" textAnchor="middle" fontFamily="Arial" fontSize="9" fill="#88ffaa">Thylakoids (Grana)</text>
      {/* Process arrows - sunlight */}
      <line x1="130" y1="85" x2="230" y2="148" stroke="#ffcc00" strokeWidth="3" markerEnd="url(#pao)" filter="url(#pglw)" opacity=".85" />
      <line x1="108" y1="95" x2="220" y2="165" stroke="#ffcc00" strokeWidth="2.5" markerEnd="url(#pao)" opacity=".6" />
      {/* CO2 arrows */}
      <line x1="106" y1="210" x2="218" y2="225" stroke="#ff8866" strokeWidth="3" markerEnd="url(#par)" strokeDasharray="7,3" opacity=".85" />
      <text x="40" y="205" fontFamily="Arial" fontSize="13" fill="#ff8866" fontWeight="bold">CO₂</text>
      <text x="38" y="220" fontFamily="Arial" fontSize="10" fill="#ff8866">in</text>
      {/* H2O from roots */}
      <path d="M350,370 L350,440 Q350,460 320,465" stroke="#4488ff" strokeWidth="4" fill="none" markerEnd="url(#pab)" opacity=".8" />
      <text x="290" y="462" fontFamily="Arial" fontSize="13" fill="#4488ff" fontWeight="bold">H₂O</text>
      <text x="290" y="475" fontFamily="Arial" fontSize="10" fill="#4488ff">from roots</text>
      {/* O2 output */}
      <line x1="470" y1="200" x2="575" y2="180" stroke="#44ff88" strokeWidth="3.5" markerEnd="url(#pag)" filter="url(#pglw)" opacity=".9" />
      <text x="590" y="176" fontFamily="Arial" fontSize="13" fill="#44ff88" fontWeight="bold">O₂</text>
      <text x="588" y="192" fontFamily="Arial" fontSize="10" fill="#44ff88">released</text>
      {/* Glucose output */}
      <line x1="465" y1="270" x2="560" y2="285" stroke="#ffdd44" strokeWidth="3" markerEnd="url(#pao)" opacity=".9" />
      <text x="565" y="285" fontFamily="Arial" fontSize="12" fill="#ffdd44" fontWeight="bold">C₆H₁₂O₆</text>
      <text x="565" y="300" fontFamily="Arial" fontSize="10" fill="#ffdd44">Glucose</text>
      {/* Formula box */}
      <rect x="168" y="390" width="364" height="70" rx="10" fill="#060e06" stroke="#226622" strokeWidth="1.5" />
      <text x="350" y="413" textAnchor="middle" fontFamily="Arial" fontSize="13" fill="#44ff88" fontWeight="bold">6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂</text>
      <text x="350" y="435" textAnchor="middle" fontFamily="Arial" fontSize="11" fill="#88aa88">Carbon Dioxide + Water + Sunlight → Glucose + Oxygen</text>
      <text x="350" y="455" textAnchor="middle" fontFamily="Arial" fontSize="10" fill="#66aa66">Occurs in chloroplasts of plant cells</text>
    </svg>
  );
}

/* ── SOLAR ECLIPSE ──────────────────────────────────────── */
function SolarEclipseDiagram() {
  return (
    <svg viewBox="0 0 700 480" style={{ display: "block", width: "100%" }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sebg" cx="18%" cy="50%" r="85%"><stop offset="0%" stopColor="#1a1a00" /><stop offset="50%" stopColor="#040818" /><stop offset="100%" stopColor="#020410" /></radialGradient>
        <radialGradient id="seSun" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#ffffff" /><stop offset="40%" stopColor="#ffff88" /><stop offset="80%" stopColor="#ffcc00" /><stop offset="100%" stopColor="#ff8800" /></radialGradient>
        <radialGradient id="seEarth" cx="40%" cy="35%" r="55%"><stop offset="0%" stopColor="#2266cc" /><stop offset="60%" stopColor="#115599" /><stop offset="100%" stopColor="#0a3366" /></radialGradient>
        <radialGradient id="seMoon" cx="35%" cy="35%" r="55%"><stop offset="0%" stopColor="#aabb99" /><stop offset="70%" stopColor="#667766" /><stop offset="100%" stopColor="#334433" /></radialGradient>
        <radialGradient id="seCorona" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#ffffff00" /><stop offset="40%" stopColor="#ffeecc22" /><stop offset="100%" stopColor="#ffcc0044" /></radialGradient>
        <filter id="seglw"><feGaussianBlur stdDeviation="8" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="seglw2"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <marker id="sea" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#00d4ff" /></marker>
      </defs>
      <rect width="700" height="480" fill="url(#sebg)" />
      {Array.from({ length: 60 }, (_, i) => <circle key={i} cx={(i * 173 + 50) % 680 + 10} cy={(i * 137 + 40) % 420 + 30} r={(i % 3) + .5} fill="#ffffff" opacity={.1 + .2 * (i % 4)} />)}
      <text x="350" y="26" textAnchor="middle" fontFamily="Arial" fontSize="16" fontWeight="bold" fill="#ffcc44" filter="url(#seglw2)">SOLAR ECLIPSE DIAGRAM</text>
      {/* Sun */}
      <circle cx="105" cy="240" r="88" fill="url(#seSun)" filter="url(#seglw)" />
      {/* Sun corona rays */}
      {Array.from({ length: 24 }, (_, i) => {
        const a = Math.PI * 2 * i / 24;
        return <line key={i} x1={105 + 95 * Math.cos(a)} y1={240 + 95 * Math.sin(a)} x2={105 + (105 + i % 3 * 8) * Math.cos(a)} y2={240 + (105 + i % 3 * 8) * Math.sin(a)} stroke="#ffcc44" strokeWidth={i % 2 ? 1.5 : 2.5} opacity={.3 + .3 * (i % 3)} />;
      })}
      {/* Corona glow */}
      <circle cx="105" cy="240" r="130" fill="url(#seCorona)" />
      {/* Moon (smaller, blocking part of sun) */}
      <circle cx="280" cy="240" r="68" fill="url(#seMoon)" filter="url(#seglw2)" />
      {/* Moon craters */}
      {[[270, 228, 8], [295, 255, 6], [258, 248, 5], [284, 225, 4]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="none" stroke="#445544" strokeWidth="1.5" opacity=".6" />
      ))}
      {/* Umbra shadow cone (total shadow) */}
      <path d="M280,172 L620,202 L620,278 L280,308 Z" fill="#000000" opacity=".7" />
      <path d="M280,172 L620,202 L620,278 L280,308 Z" fill="#0a0520" opacity=".6" />
      {/* Penumbra (partial shadow) */}
      <path d="M140,152 L620,180 L620,300 L140,328 Z" fill="#0d0828" opacity=".35" />
      <path d="M140,152 L620,180 L620,300 L140,328 Z" fill="#1a1035" opacity=".3" />
      {/* Penumbra outer */}
      <path d="M44,120 L620,160 L620,320 L44,360 Z" fill="#100820" opacity=".15" />
      {/* Earth */}
      <circle cx="598" cy="240" r="58" fill="url(#seEarth)" filter="url(#seglw2)" stroke="#2266cc" strokeWidth="2" />
      {/* Earth continents (simplified) */}
      <path d="M590,215 Q604,212 610,222 Q616,232 608,240 Q600,245 595,238 Q588,230 590,215 Z" fill="#44aa44" opacity=".7" />
      <path d="M575,248 Q582,244 588,252 Q594,260 586,265 Q578,268 574,260 Z" fill="#44aa44" opacity=".6" />
      {/* Shadow regions on Earth */}
      <path d="M563,195 Q615,195 640,240 Q615,285 563,285 Q548,260 548,240 Q548,220 563,195 Z" fill="#000" opacity=".7" />
      {/* Observer on Earth */}
      <circle cx="590" cy="184" r="5" fill="#00ff88" filter="url(#seglw2)" />
      <text x="590" y="176" textAnchor="middle" fontFamily="Arial" fontSize="9" fill="#44ff88">You</text>
      {/* Alignment line */}
      <line x1="105" y1="240" x2="280" y2="240" stroke="#ffcc00" strokeWidth="1.5" strokeDasharray="8,4" opacity=".5" />
      <line x1="280" y1="240" x2="598" y2="240" stroke="#ffcc00" strokeWidth="1.5" strokeDasharray="8,4" opacity=".5" />
      {/* Labels */}
      {[
        [84, 348, "SUN"],
        [266, 330, "MOON"],
        [582, 316, "EARTH"],
        [410, 168, "Umbra (Total Shadow)"],
        [310, 140, "Penumbra (Partial Shadow)"],
        [500, 385, "Path of Totality"],
      ].map(([x, y, label]) => (
        <text key={label} x={x} y={y} textAnchor="middle" fontFamily="Arial" fontSize={label.length > 20 ? 10 : 12} fill="#aaccff" fontWeight="bold">{label}</text>
      ))}
      {/* Distance indicators */}
      <line x1="105" y1="400" x2="280" y2="400" stroke="#667788" strokeWidth="1.5" markerEnd="url(#sea)" opacity=".6" />
      <line x1="280" y1="400" x2="105" y2="400" stroke="#667788" strokeWidth="1.5" markerEnd="url(#sea)" opacity=".6" />
      <text x="192" y="418" textAnchor="middle" fontFamily="Arial" fontSize="10" fill="#667788">384,400 km</text>
      <line x1="105" y1="432" x2="598" y2="432" stroke="#667788" strokeWidth="1.5" markerEnd="url(#sea)" opacity=".6" />
      <text x="350" y="448" textAnchor="middle" fontFamily="Arial" fontSize="10" fill="#667788">Earth–Sun: 149.6 million km</text>
    </svg>
  );
}

const DIAGRAM_MAP = {
  volcano: { Component: VolcanoDiagram, label: "🌋 Volcano", desc: "Cross-section" },
  "plant-cell": { Component: PlantCellDiagram, label: "🧬 Plant Cell", desc: "Structure" },
  "water-cycle": { Component: WaterCycleDiagram, label: "💧 Water Cycle", desc: "Process" },
  heart: { Component: HeartDiagram, label: "🫀 Human Heart", desc: "Anatomy" },
  atom: { Component: AtomDiagram, label: "⚛️ Atom", desc: "Bohr Model" },
  circuit: { Component: CircuitDiagram, label: "⚡ Electric Circuit", desc: "Schematic" },
  photosynthesis: { Component: PhotosynthesisDiagram, label: "🌿 Photosynthesis", desc: "Process" },
  eclipse: { Component: SolarEclipseDiagram, label: "☀️ Solar Eclipse", desc: "Diagram" },
};

/* ═══════════════════════════════════════════════════════════
   HAND GESTURE CONTROLLER
═══════════════════════════════════════════════════════════ */
const GESTURE_LABELS = {
  none: "—", point: "☝️ Pointing", peace: "✌️ Peace", three: "🤟 3 Fingers",
  fist: "✊ Fist", open: "🖐️ Open Hand", pinch: "🤌 Pinch",
  swipe_right: "👉 Swipe Right", swipe_left: "👈 Swipe Left",
};
const GESTURE_ACTIONS = {
  fist: "→ AI Assistant", open: "→ Show Guide", point: "→ Move Cursor",
  pinch: "→ Click", peace: "→ Quiz Tab", three: "→ Lesson Tab",
  swipe_right: "→ Next Tab", swipe_left: "→ Prev Tab",
};

function VirtualCursor({ x, y, visible, pinching, dwelling, dwellPct }) {
  if (!visible) return null;
  return (
    <div style={{ position: "fixed", left: x - 22, top: y - 22, width: 44, height: 44, pointerEvents: "none", zIndex: 9999 }}>
      <svg width="44" height="44">
        <circle cx="22" cy="22" r="14" fill="none" stroke={pinching ? "#00ff88" : "#00d4ff"} strokeWidth="2.5" opacity=".9" />
        <circle cx="22" cy="22" r="5" fill={pinching ? "#00ff88" : "#00d4ff"} opacity=".8" />
        {dwelling && dwellPct > 0 && (
          <circle cx="22" cy="22" r="18" fill="none" stroke="#ffaa00" strokeWidth="3"
            strokeDasharray={`${dwellPct * 113} 113`} strokeLinecap="round"
            transform="rotate(-90 22 22)" opacity=".9" />
        )}
      </svg>
    </div>
  );
}

function HandGesturePanel({ onTabChange, currentTab, tabIds, enabled, onToggle, onWhiteboardGesture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const modelRef = useRef(null);
  const animRef = useRef(null);
  const prevWristRef = useRef(null);
  const swipeTimerRef = useRef(null);
  const dwellRef = useRef({ el: null, start: 0, x: 0, y: 0 });
  const gestureBufferRef = useRef({ gesture: "none", count: 0 });
  const actionCooldownRef = useRef(null);
  const velocityRef = useRef({ x: 0, y: 0 });

  const [status, setStatus] = useState("idle"); // idle|loading|ready|error
  const [gesture, setGesture] = useState("none");
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false, pinching: false, dwelling: false, dwellPct: 0 });
  const [minimized, setMinimized] = useState(false);
  const [gestureLog, setGestureLog] = useState([]);
  const [showGuide, setShowGuide] = useState(false);

  const logGesture = (g, action) => {
    setGestureLog(p => [{ g, action, t: new Date().toLocaleTimeString() }, ...p.slice(0, 6)]);
  };

  const getFingersUp = (lm) => {
    const tips = [8, 12, 16, 20], pips = [6, 10, 14, 18];
    return tips.map((tip, i) => lm[tip][1] < lm[pips[i]][1]);
  };
  const isThumbUp = (lm) => lm[4][1] < lm[3][1];
  const isPinching = (lm) => {
    const dx = lm[4][0] - lm[8][0], dy = lm[4][1] - lm[8][1];
    return Math.sqrt(dx * dx + dy * dy) < 40;
  };
  const classifyGesture = (lm) => {
    const fingers = getFingersUp(lm);
    const thumb = isThumbUp(lm);
    const pinch = isPinching(lm);
    if (pinch) return "pinch";
    const count = fingers.filter(Boolean).length + (thumb ? 1 : 0);
    if (count === 0) return "fist";
    if (count >= 5) return "open";
    if (fingers[0] && !fingers[1] && !fingers[2] && !fingers[3]) return "point";
    if (fingers[0] && fingers[1] && !fingers[2] && !fingers[3]) return "peace";
    if (fingers[0] && fingers[1] && fingers[2] && !fingers[3]) return "three";
    return "none";
  };

  const processLandmarks = useCallback((lm, videoW, videoH) => {
    const rawG = classifyGesture(lm);
    // Gesture stability: require 4 consecutive same frames to avoid flicker
    if (rawG === gestureBufferRef.current.gesture) {
      gestureBufferRef.current.count = Math.min(gestureBufferRef.current.count + 1, 6);
    } else {
      gestureBufferRef.current = { gesture: rawG, count: 1 };
    }
    const g = gestureBufferRef.current.count >= 4 ? rawG : gesture;
    setGesture(g);

    // Cursor from index fingertip (mirrored) with velocity-adaptive smoothing
    const rawX = (1 - lm[8][0] / videoW) * window.innerWidth;
    const rawY = (lm[8][1] / videoH) * window.innerHeight;
    const pinching = g === "pinch";
    setCursor(p => {
      // Velocity-adaptive lerp: fast motion = snappy (0.55), slow = ultra-smooth (0.15)
      const vx = Math.abs(rawX - p.x);
      const vy = Math.abs(rawY - p.y);
      const speed = Math.sqrt(vx * vx + vy * vy);
      const lerpF = Math.min(0.55, Math.max(0.15, speed / 300));
      const tipX = p.visible ? p.x + (rawX - p.x) * lerpF : rawX;
      const tipY = p.visible ? p.y + (rawY - p.y) * lerpF : rawY;
      // Track velocity for other uses
      velocityRef.current = { x: rawX - p.x, y: rawY - p.y };

      // ── UNIVERSAL DWELL CLICK ──
      const el = document.elementFromPoint(tipX, tipY);
      if (el && el.closest("button,a")) {
        if (!p.dwelling || Math.abs(p.x - tipX) > 30 || Math.abs(p.y - tipY) > 30) {
          dwellRef.current = { el, start: Date.now(), x: tipX, y: tipY };
        } else {
          const pct = Math.min(1, (Date.now() - dwellRef.current.start) / 900);
          if (pct >= 1 && dwellRef.current.el) {
            dwellRef.current.el.click();
            dwellRef.current.el = null;
            logGesture("☝️", "Dwell Click");
          }
          return { ...p, x: tipX, y: tipY, visible: true, pinching, dwelling: true, dwellPct: pct };
        }
      } else { dwellRef.current = { el: null, start: 0, x: tipX, y: tipY }; }

      return { x: tipX, y: tipY, visible: true, pinching, dwelling: false, dwellPct: 0 };
    });

    // ── SWIPE GESTURE FOR TABS ──
    const swipeThresh = 0.04;
    const wx = lm[0][0] / videoW;
    if (prevWristRef.current !== null) {
      const dx = wx - prevWristRef.current;
      if (Math.abs(dx) > swipeThresh && !swipeTimerRef.current) {
        swipeTimerRef.current = setTimeout(() => { swipeTimerRef.current = null; }, 700);
        if (dx > 0) {
          const ci = tabIds.indexOf(currentTab);
          const next = tabIds[(ci + 1) % tabIds.length];
          onTabChange(next); logGesture("👈", "→ Next Tab: " + next);
        } else {
          const ci = tabIds.indexOf(currentTab);
          const prev = tabIds[(ci - 1 + tabIds.length) % tabIds.length];
          onTabChange(prev); logGesture("👉", "→ Prev Tab: " + prev);
        }
      }
    }
    prevWristRef.current = wx;

    // ── UNIVERSAL GESTURE ACTIONS ──
    if (!actionCooldownRef.current) {
      let acted = false;
      if (g === "fist") { onTabChange("assistant"); logGesture("✊", "→ AI Assistant"); acted = true; }
      if (g === "peace") { onTabChange("quiz"); logGesture("✌️", "→ Quiz"); acted = true; }
      if (g === "three") { onTabChange("lesson"); logGesture("🤟", "→ Lesson"); acted = true; }
      if (g === "open") { setShowGuide(true); logGesture("🖐️", "→ Guide Shown"); acted = true; }
      if (acted) actionCooldownRef.current = setTimeout(() => { actionCooldownRef.current = null; }, 1000);
    }
  }, [currentTab, tabIds, onTabChange, gesture]);

  useEffect(() => {
    if (!enabled) {
      cancelAnimationFrame(animRef.current);
      setCursor(p => ({ ...p, visible: false }));
      return;
    }
    let cancelled = false;
    const init = async () => {
      setStatus("loading");
      try {
        await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.11.0/dist/tf.min.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/handpose@0.0.7/dist/handpose.min.js");
        if (cancelled) return;
        setStatus("model");
        const model = await window.handpose.load({ maxContinuousChecks: 5, detectionConfidence: .85, iouThreshold: .3, scoreThreshold: .7 });
        modelRef.current = model;
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: "user" } });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        videoRef.current.srcObject = stream;
        await new Promise(r => videoRef.current.addEventListener("loadedmetadata", r, { once: true }));
        videoRef.current.play();
        setStatus("ready");
        const detect = async () => {
          if (cancelled || !modelRef.current) return;
          try {
            const preds = await modelRef.current.estimateHands(videoRef.current);
            if (preds.length > 0) {
              const lm = preds[0].landmarks;
              // Draw on canvas
              const ctx = canvasRef.current?.getContext("2d");
              if (ctx && canvasRef.current) {
                ctx.clearRect(0, 0, 320, 240);
                ctx.save(); ctx.scale(-1, 1); ctx.translate(-320, 0);
                // Draw skeleton with smooth lines
                const pairs = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [0, 9], [9, 10], [10, 11], [11, 12], [0, 13], [13, 14], [14, 15], [15, 16], [0, 17], [17, 18], [18, 19], [19, 20]];
                ctx.lineCap = "round"; ctx.lineJoin = "round";
                pairs.forEach(([a, b]) => {
                  ctx.beginPath(); ctx.moveTo(lm[a][0], lm[a][1]); ctx.lineTo(lm[b][0], lm[b][1]);
                  ctx.strokeStyle = "rgba(0,255,136,0.45)"; ctx.lineWidth = 2.5; ctx.stroke();
                });
                lm.forEach(([x, y], i) => {
                  ctx.beginPath(); ctx.arc(x, y, i === 8 || i === 4 ? 5 : 3.5, 0, Math.PI * 2);
                  ctx.fillStyle = i === 8 ? "#00d4ff" : i === 4 ? "#ff8800" : "#00ff88";
                  ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 6; ctx.fill(); ctx.shadowBlur = 0;
                });
                ctx.restore();
              }
              processLandmarks(lm, videoRef.current.videoWidth || 320, videoRef.current.videoHeight || 240);
            } else { setCursor(p => ({ ...p, visible: false })); }
          } catch { }
          if (!cancelled) animRef.current = requestAnimationFrame(detect);
        };
        detect();
      } catch (e) {
        if (!cancelled) setStatus("error");
        console.error("Handpose:", e);
      }
    };
    init();
    return () => {
      cancelled = true; cancelAnimationFrame(animRef.current);
      if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      setCursor(p => ({ ...p, visible: false }));
    };
  }, [enabled]);

  if (!enabled) return null;

  const statusMsg = { idle: "—", loading: "Loading TensorFlow.js…", model: "Loading Handpose model…", ready: "✅ Hand tracking active", error: "❌ Failed — check console" };

  return (
    <>
      <VirtualCursor {...cursor} />
      {/* Floating gesture panel */}
      <div style={{ position: "fixed", bottom: 48, right: 18, zIndex: 9998, width: minimized ? 52 : 296, background: "rgba(4,7,13,.96)", border: `1px solid ${T.cyan}44`, borderRadius: 16, overflow: "hidden", backdropFilter: "blur(8px)", transition: "width .3s ease", boxShadow: `0 0 30px ${T.cyan}22` }}>
        {/* Header */}
        <div style={{ padding: "10px 14px", background: `linear-gradient(90deg,${T.cyanDim}44,transparent)`, display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${T.border}`, cursor: "pointer" }} onClick={() => setMinimized(p => !p)}>
          <span style={{ fontSize: 18 }}>🖐️</span>
          {!minimized && <span style={{ color: T.cyan, fontSize: 12, fontWeight: 700, letterSpacing: 1, flex: 1 }}>GESTURE CONTROL</span>}
          {!minimized && <span style={{ color: T.muted, fontSize: 14 }}>{minimized ? "▲" : "▼"}</span>}
        </div>
        {!minimized && (
          <div style={{ padding: 12 }}>
            {/* Status */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "6px 10px", background: T.bg, borderRadius: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: status === "ready" ? T.green : status === "error" ? T.red : T.amber, animation: status === "loading" || status === "model" ? "pulse 1.2s infinite" : "none" }} />
              <span style={{ color: T.muted, fontSize: 11 }}>{statusMsg[status]}</span>
            </div>
            {/* Webcam feed */}
            <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", marginBottom: 10, background: "#000", height: 130 }}>
              <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: "block" }} muted playsInline />
              <canvas ref={canvasRef} width="320" height="240" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", transform: "scaleX(1)" }} />
            </div>
            {/* Current gesture */}
            <div style={{ textAlign: "center", padding: "8px 0", marginBottom: 10, background: `${T.cyan}0a`, borderRadius: 8, border: `1px solid ${T.cyan}22` }}>
              <div style={{ fontSize: 24 }}>{GESTURE_LABELS[gesture]?.split(" ")[0] || "—"}</div>
              <div style={{ color: T.cyan, fontSize: 12, fontWeight: 700 }}>{GESTURE_LABELS[gesture] || "No hand detected"}</div>
              {GESTURE_ACTIONS[gesture] && <div style={{ color: T.green, fontSize: 11, marginTop: 2 }}>{GESTURE_ACTIONS[gesture]}</div>}
            </div>
            {/* Recent log */}
            <div style={{ maxHeight: 88, overflowY: "auto" }}>
              {gestureLog.slice(0, 4).map((l, i) => (
                <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", padding: "3px 6px", background: T.bg, borderRadius: 5, marginBottom: 3, opacity: 1 - i * .2 }}>
                  <span style={{ fontSize: 12 }}>{l.g}</span>
                  <span style={{ color: T.muted, fontSize: 10, flex: 1 }}>{l.action}</span>
                  <span style={{ color: T.dimTxt, fontSize: 9 }}>{l.t}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowGuide(p => !p)} style={{ width: "100%", marginTop: 8, background: "none", border: `1px solid ${T.border2}`, borderRadius: 8, color: T.muted, padding: "6px 0", fontSize: 11, cursor: "pointer", fontFamily: "Rajdhani,sans-serif", fontWeight: 600 }}>{showGuide ? "Hide" : "Show"} Gesture Guide</button>
          </div>
        )}
      </div>
      {/* Gesture Guide Overlay */}
      {showGuide && !minimized && (
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 10000, background: "rgba(4,7,13,.97)", border: `1px solid ${T.cyan}55`, borderRadius: 20, padding: 28, width: 480, maxHeight: "85vh", overflowY: "auto", boxShadow: `0 0 60px ${T.cyan}22`, backdropFilter: "blur(10px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ color: T.cyan, fontWeight: 800, fontSize: 17, letterSpacing: 1 }}>🖐️ GESTURE GUIDE</div>
            <button onClick={() => setShowGuide(false)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 22 }}>✕</button>
          </div>

          {/* Universal Mode */}
          <div style={{ color: T.cyan, fontWeight: 700, fontSize: 12, letterSpacing: 2, marginBottom: 8, padding: "6px 10px", background: `${T.cyan}10`, borderRadius: 8, border: `1px solid ${T.cyan}33` }}>🌐 UNIVERSAL MODE — All Tabs</div>
          {[
            ["☝️", "Point", "Move cursor — hover to highlight buttons"],
            ["☝️ Hold", "Dwell Click", "Hover on button for 0.9s to auto-click"],
            ["✌️", "Peace", "Navigate → Quiz Generator"],
            ["🤟", "3 Fingers", "Navigate → Lesson Planner"],
            ["✊", "Fist", "Navigate → AI Assistant"],
            ["🖐️", "Open Hand", "Show/Hide this guide"],
            ["👉", "Swipe Right", "Next Tab"],
            ["👈", "Swipe Left", "Previous Tab"],
          ].map(([icon, name, desc]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 26, width: 44, textAlign: "center" }}>{icon}</span>
              <div><div style={{ color: T.txt, fontWeight: 700, fontSize: 13 }}>{name}</div><div style={{ color: T.muted, fontSize: 11, marginTop: 1 }}>{desc}</div></div>
            </div>
          ))}

          {/* Whiteboard Mode */}
          <div style={{ color: "#00ff88", fontWeight: 700, fontSize: 12, letterSpacing: 2, marginTop: 16, marginBottom: 8, padding: "6px 10px", background: "rgba(0,255,136,.08)", borderRadius: 8, border: "1px solid rgba(0,255,136,.3)" }}>✏️ WHITEBOARD MODE — Auto-activates on Whiteboard tab</div>
          {[
            ["☝️", "Point Finger", "Draw on canvas — your finger is the pen"],
            ["✌️", "Peace Sign", "Eraser — block eraser follows your hand"],
            ["🤏", "Pinch", "Cycle through 7 colors"],
            ["🤟", "3 Fingers", "Cycle brush size (2/4/7/11px)"],
            ["✊", "Fist", "Clear entire canvas"],
            ["👉👈", "Swipe", "Still switches tabs (always works)"],
          ].map(([icon, name, desc]) => (
            <div key={name + "wb"} style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 26, width: 44, textAlign: "center" }}>{icon}</span>
              <div><div style={{ color: "#00ff88", fontWeight: 700, fontSize: 13 }}>{name}</div><div style={{ color: T.muted, fontSize: 11, marginTop: 1 }}>{desc}</div></div>
            </div>
          ))}

          <div style={{ marginTop: 16, padding: "10px 14px", background: `${T.amber}10`, border: `1px solid ${T.amber}33`, borderRadius: 10, color: T.muted, fontSize: 11, lineHeight: 1.7 }}>
            💡 <strong style={{ color: T.amber }}>Tip:</strong> Gestures auto-switch! On the Whiteboard tab, your hand becomes a drawing tool. On all other tabs, gestures control navigation. A glowing cursor shows your position on the canvas.
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   DIAGRAM PANEL — Pre-built + AI Generation
═══════════════════════════════════════════════════════════ */
function DiagramPanel() {
  const [view, setView] = useState("gallery"); // gallery | prebuilt | ai
  const [selected, setSelected] = useState(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateAI = async (text) => {
    const msg = text || aiPrompt.trim(); if (!msg || loading) return;
    if (text) setAiPrompt(text);
    setLoading(true); setAiResult(null); setView("ai");
    try {
      const svgCode = await callAI(
        `Create a richly illustrated, colorful SVG educational diagram of: "${msg}"\n\nSTRICT RULES:\n- Return ONLY SVG code. Start with <svg and end with </svg>. NO explanation, NO backticks.\n- width="700" height="480" viewBox="0 0 700 480"\n- First element: <rect width="700" height="480" fill="#06101e"/>\n- VIVID COLORS: use bright cyan, lime green, orange, yellow, red, purple on dark background\n- Include <defs> with <linearGradient> and <radialGradient> elements and USE them as fill="url(#id)"\n- Draw REALISTIC shapes representing the subject's actual anatomy/structure using <circle>,<ellipse>,<path>,<polygon>,<rect> with fills and strokes\n- Add <filter id="gf"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter> and use it on key elements\n- Add <marker id="arr" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#00d4ff"/></marker> in defs for arrows\n- Bright cyan title at top, font-size="16", font-weight="bold"\n- At least 12 labeled parts with <text> elements (fill="#aaccff" or white, font-family="Arial" font-size="11-13")\n- Draw <line> arrows from labels to structures with marker-end="url(#arr)"\n- Use thick strokes (strokeWidth 2-4) for main outlines\n- Make it look like a professional colorful textbook illustration\n- Include a key/legend box if applicable`,
        "", 3200
      );
      const clean = svgCode.replace(/```svg|```xml|```/g, "").trim();
      const s = clean.indexOf("<svg"), e = clean.lastIndexOf("</svg>") + 6;
      if (s === -1) throw new Error("No SVG in response");
      setAiResult({ prompt: msg, svg: clean.slice(s, e) });
    } catch (er) {
      setAiResult({ prompt: msg, svg: null, error: er.message });
    }
    setLoading(false);
  };

  const D = selected && DIAGRAM_MAP[selected];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${T.border}`, background: T.surf, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <span style={{ fontSize: 28, filter: `drop-shadow(0 0 12px ${T.purple}88)` }}>🎨</span>
          <div><div style={{ color: T.txt, fontSize: 18, fontWeight: 700 }}>AI Visual Diagram Generator</div><div style={{ color: T.muted, fontSize: 11, marginTop: 1 }}>Pre-built illustrated diagrams + AI custom generation</div></div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {[["gallery", "🗂️ Gallery"], ["prebuilt", "📐 View"], ["ai", "🤖 AI Custom"]].map(([v, l]) => (
              <button key={v} onClick={() => setView(v)} style={{ background: view === v ? `${T.purple}18` : T.surf2, border: `1px solid ${view === v ? T.purple : T.border}`, borderRadius: 8, color: view === v ? T.purple : T.muted, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "Rajdhani,sans-serif", fontWeight: 600 }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder='Type custom topic for AI diagram (e.g. "respiratory system", "DNA structure")' onKeyDown={e => e.key === "Enter" && generateAI()} style={{ flex: 1 }} />
          <PrimaryBtn onClick={() => generateAI()} disabled={loading || !aiPrompt.trim()} style={{ whiteSpace: "nowrap", background: `linear-gradient(135deg,#44008a,#1a0040)`, borderColor: T.purple, color: T.purple }}>
            {loading ? "⏳" : "🤖 AI Generate"}
          </PrimaryBtn>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* GALLERY */}
        {view === "gallery" && (
          <div style={{ padding: 20 }}>
            <div style={{ color: T.muted, fontSize: 12, marginBottom: 16, letterSpacing: .5, fontWeight: 700 }}>PRE-BUILT EDUCATIONAL DIAGRAMS — Click to view full illustration</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
              {Object.entries(DIAGRAM_MAP).map(([key, { Component, label, desc }]) => (
                <button key={key} onClick={() => { setSelected(key); setView("prebuilt"); }} style={{ background: T.surf2, border: `1px solid ${selected === key ? T.purple : T.border}`, borderRadius: 14, padding: 0, cursor: "pointer", textAlign: "left", transition: "all .2s", overflow: "hidden", position: "relative" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.purple; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = selected === key ? T.purple : T.border; e.currentTarget.style.transform = ""; }}>
                  <div style={{ width: "100%", height: 110, overflow: "hidden", pointerEvents: "none", background: "#060e0a" }}>
                    <div style={{ transform: "scale(.48)", transformOrigin: "top left", width: "208%", height: "208%", pointerEvents: "none" }}>
                      <Component />
                    </div>
                  </div>
                  <div style={{ padding: "10px 12px", borderTop: `1px solid ${T.border}` }}>
                    <div style={{ color: T.txt, fontSize: 13, fontWeight: 600 }}>{label}</div>
                    <div style={{ color: T.muted, fontSize: 10, marginTop: 2 }}>{desc}</div>
                  </div>
                </button>
              ))}
            </div>
            {/* AI custom section */}
            <div style={{ background: T.surf2, border: `1px solid ${T.purple}33`, borderRadius: 14, padding: 16 }}>
              <div style={{ color: T.purple, fontWeight: 700, fontSize: 13, marginBottom: 10, letterSpacing: 1 }}>🤖 AI CUSTOM DIAGRAMS</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {["respiratory system", "DNA double helix", "tectonic plates", "Newton's laws", "electromagnetic waves", "human eye anatomy"].map(t => (
                  <button key={t} onClick={() => generateAI(t)} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 20, color: T.muted, padding: "5px 14px", fontSize: 12, cursor: "pointer", fontFamily: "Rajdhani,sans-serif", fontWeight: 500, transition: "all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.purple; e.currentTarget.style.color = T.purple; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}>{t}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PRE-BUILT VIEW */}
        {view === "prebuilt" && (
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {Object.entries(DIAGRAM_MAP).map(([key, { label }]) => (
                <button key={key} onClick={() => setSelected(key)} style={{ background: selected === key ? `${T.purple}22` : T.surf2, border: `1px solid ${selected === key ? T.purple : T.border}`, borderRadius: 20, color: selected === key ? T.purple : T.muted, padding: "5px 14px", fontSize: 12, cursor: "pointer", fontFamily: "Rajdhani,sans-serif", fontWeight: 600 }}>{label}</button>
              ))}
            </div>
            {D && (
              <div style={{ background: "#06101e", border: `1px solid ${T.purple}44`, borderRadius: 16, overflow: "hidden", boxShadow: `0 0 40px ${T.purple}14` }}>
                <D.Component />
              </div>
            )}
            {!D && <div style={{ color: T.muted, padding: 40, textAlign: "center" }}>Select a diagram above</div>}
          </div>
        )}

        {/* AI RESULT */}
        {view === "ai" && (
          <div style={{ padding: 20 }}>
            {loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 20 }}>
                <div style={{ position: "relative", width: 70, height: 70 }}>
                  <div style={{ position: "absolute", inset: 0, border: `3px solid ${T.border2}`, borderTopColor: T.purple, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                  <div style={{ position: "absolute", inset: 10, border: `2px solid ${T.border2}`, borderBottomColor: T.cyan, borderRadius: "50%", animation: "spin 1.3s linear infinite reverse" }} />
                </div>
                <div style={{ color: T.muted, fontSize: 14 }}>AI is drawing your diagram…</div>
              </div>
            )}
            {aiResult && !loading && (
              <div style={{ animation: "fadeSlide .4s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ color: T.txt, fontSize: 16, fontWeight: 700 }}>{aiResult.prompt}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Tag label="AI SVG" color={T.purple} />
                    <button onClick={() => generateAI()} style={{ background: `${T.purple}18`, border: `1px solid ${T.purple}44`, borderRadius: 8, color: T.purple, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontFamily: "Rajdhani,sans-serif", fontWeight: 600 }}>🔄 Regenerate</button>
                  </div>
                </div>
                {aiResult.svg ? (
                  <div style={{ background: "#06101e", border: `1px solid ${T.purple}44`, borderRadius: 16, overflow: "hidden" }}>
                    <div dangerouslySetInnerHTML={{ __html: aiResult.svg.replace("<svg", `<svg style="width:100%;height:auto;display:block;"`) }} />
                  </div>
                ) : (
                  <div style={{ padding: 20, color: "#ff8888", background: "#1a0808", borderRadius: 10 }}>⚠️ {aiResult.error}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   OTHER PANELS (condensed)
═══════════════════════════════════════════════════════════ */
function AssistantPanel() {
  const [msgs, setMsgs] = useState([{ role: "assistant", content: "👋 Welcome to NOVA AI!\n\nAsk me to explain any topic, generate examples, or create quiz questions.\n\n💡 Try: \"Explain Newton's Third Law for Grade 8\"" }]);
  const [input, setInput] = useState(""); const [loading, setLoading] = useState(false); const bottomRef = useRef(null);
  const SUGS = ["Explain Newton's Third Law for Grade 8", "How does photosynthesis work?", "Explain the water cycle", "What is the Pythagorean theorem?", "Describe the human digestive system"];
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [msgs]);
  const send = async (text) => {
    const msg = text || input.trim(); if (!msg || loading) return;
    setInput(""); setMsgs(p => [...p, { role: "user", content: msg }]); setLoading(true);
    try { const r = await callAI(msg, "You are an enthusiastic AI teaching assistant. Structure your response: 📖 EXPLANATION, 💡 EXAMPLES (2-3), 🔑 KEY POINTS (3-4 bullets), ❓ QUIZ QUESTIONS (2). Keep it engaging and educational."); setMsgs(p => [...p, { role: "assistant", content: r }]); } catch (e) { setMsgs(p => [...p, { role: "assistant", content: `⚠️ ${e.message}` }]); }
    setLoading(false);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "10px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 8, flexWrap: "wrap", background: T.surf }}>
        {SUGS.map(s => <button key={s} onClick={() => send(s)} style={{ background: T.surf2, border: `1px solid ${T.border2}`, borderRadius: 20, color: T.muted, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontFamily: "Rajdhani,sans-serif", fontWeight: 500, transition: "all .15s", whiteSpace: "nowrap" }} onMouseEnter={e => { e.target.style.borderColor = T.cyan; e.target.style.color = T.cyan; }} onMouseLeave={e => { e.target.style.borderColor = T.border2; e.target.style.color = T.muted; }}>{s}</button>)}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", animation: "fadeSlide .3s ease" }}>
            {m.role === "assistant" && <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,${T.cyanDim},#003355)`, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10, flexShrink: 0, fontSize: 16, border: `1px solid ${T.border2}` }}>🤖</div>}
            <div style={{ maxWidth: "82%", padding: "12px 16px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px", background: m.role === "user" ? `linear-gradient(135deg,${T.cyanDim},#003355)` : T.surf2, border: `1px solid ${m.role === "user" ? T.cyanDim : T.border}`, color: T.txt, fontSize: 14, lineHeight: 1.75, whiteSpace: "pre-wrap", fontFamily: "Rajdhani,sans-serif", fontWeight: 500 }}>{m.content}</div>
            {m.role === "user" && <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,#005520,#002210)`, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 10, flexShrink: 0, fontSize: 16, border: `1px solid ${T.border2}` }}>👩‍🏫</div>}
          </div>
        ))}
        {loading && <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,${T.cyanDim},#003355)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, border: `1px solid ${T.border2}` }}>🤖</div><div style={{ padding: "14px 18px", borderRadius: "4px 18px 18px 18px", background: T.surf2, border: `1px solid ${T.border}`, display: "flex", gap: 6, alignItems: "center" }}>{[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: T.cyan, animation: `bounce .9s ease-in-out ${i * .18}s infinite` }} />)}</div></div>}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "14px 18px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 10, background: T.surf }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ask anything… (Enter to send)" rows={2} style={{ flex: 1, background: T.surf2, border: `1px solid ${T.border2}`, borderRadius: 12, color: T.txt, padding: "10px 14px", fontSize: 14, resize: "none", fontFamily: "Rajdhani,sans-serif", fontWeight: 500, lineHeight: 1.5 }} />
        <PrimaryBtn onClick={() => send()} disabled={loading || !input.trim()} style={{ width: 50, height: 50, alignSelf: "flex-end", borderRadius: 12, padding: 0, fontSize: 20 }}>➤</PrimaryBtn>
      </div>
    </div>
  );
}

function LessonPanel() {
  const [topic, setTopic] = useState(""); const [grade, setGrade] = useState("7"); const [duration, setDuration] = useState("40");
  const [plan, setPlan] = useState(null); const [loading, setLoading] = useState(false); const [err, setErr] = useState("");
  const generate = async () => {
    if (!topic.trim() || loading) return; setLoading(true); setErr(""); setPlan(null);
    try {
      const raw = await callAI(`Generate a lesson plan:\nTopic:${topic}\nGrade:${grade}\nDuration:${duration}min\nReturn ONLY valid JSON (no backticks):\n{"title":"...","objectives":["..."],"introduction":"...","teaching_points":[{"point":"...","explanation":"...","activity":"..."}],"activities":[{"name":"...","duration":"...","description":"..."}],"quiz":[{"q":"...","options":["A","B","C","D"],"answer":0}],"summary":"...","homework":"..."}`);
      setPlan(JSON.parse(raw.replace(/```json|```/g, "").trim()));
    } catch (e) { setErr("Error: " + e.message); } setLoading(false);
  };
  const sel = { background: T.surf2, border: `1px solid ${T.border2}`, borderRadius: 10, color: T.txt, padding: "10px 14px", fontSize: 14, width: "100%", fontFamily: "Rajdhani,sans-serif" };
  return (
    <div style={{ padding: 24, height: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}><span style={{ fontSize: 32 }}>📋</span><div><div style={{ color: T.txt, fontSize: 20, fontWeight: 700 }}>Lesson Plan Generator</div><div style={{ color: T.muted, fontSize: 12 }}>AI-generated comprehensive lesson plans</div></div></div>
      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={{ color: T.muted, fontSize: 11, display: "block", marginBottom: 5, letterSpacing: 1, fontWeight: 700 }}>TOPIC *</label><Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Photosynthesis…" onKeyDown={e => e.key === "Enter" && generate()} /></div>
          <div><label style={{ color: T.muted, fontSize: 11, display: "block", marginBottom: 5, letterSpacing: 1, fontWeight: 700 }}>GRADE</label><select value={grade} onChange={e => setGrade(e.target.value)} style={sel}>{[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>Grade {i + 1}</option>)}</select></div>
          <div><label style={{ color: T.muted, fontSize: 11, display: "block", marginBottom: 5, letterSpacing: 1, fontWeight: 700 }}>DURATION</label><select value={duration} onChange={e => setDuration(e.target.value)} style={sel}>{[30, 40, 45, 50, 60, 90].map(d => <option key={d} value={d}>{d} min</option>)}</select></div>
        </div>
        <PrimaryBtn onClick={generate} disabled={loading || !topic.trim()} style={{ width: "100%" }}>{loading ? "⏳ Generating…" : "✨ Generate Lesson Plan"}</PrimaryBtn>
      </Card>
      {loading && <Spinner />}{err && <div style={{ color: "#ff8888", padding: 14, background: "#1a0808", border: `1px solid #ff444433`, borderRadius: 10 }}>{err}</div>}
      {plan && !loading && (<div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeSlide .4s ease" }}>
        <Card><div style={{ color: T.cyan, fontSize: 18, fontWeight: 800, marginBottom: 10 }}>{plan.title}</div><CardTitle>🎯 Objectives</CardTitle><ul style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 5 }}>{plan.objectives?.map((o, i) => <li key={i} style={{ color: T.txt, lineHeight: 1.6, fontSize: 14 }}>{o}</li>)}</ul></Card>
        <Card><CardTitle>🚀 Introduction</CardTitle><p style={{ color: T.txt, lineHeight: 1.75, fontSize: 14 }}>{plan.introduction}</p></Card>
        <Card><CardTitle>📚 Teaching Points</CardTitle>{plan.teaching_points?.map((tp, i) => <div key={i} style={{ marginBottom: i < plan.teaching_points.length - 1 ? 16 : 0, paddingBottom: i < plan.teaching_points.length - 1 ? 16 : 0, borderBottom: i < plan.teaching_points.length - 1 ? `1px solid ${T.border}` : "none" }}><div style={{ color: T.cyan, fontWeight: 700, fontSize: 14, marginBottom: 5 }}>📌 {tp.point}</div><div style={{ color: T.txt, fontSize: 13, lineHeight: 1.65, marginBottom: 5 }}>{tp.explanation}</div><div style={{ color: T.green, fontSize: 12 }}>💡 {tp.activity}</div></div>)}</Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Card><CardTitle>🎮 Activities</CardTitle>{plan.activities?.map((a, i) => <div key={i} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", marginBottom: 7 }}><div style={{ color: T.amber, fontWeight: 700, fontSize: 13 }}>{a.name}</div><div style={{ color: T.cyan, fontSize: 11, margin: "3px 0" }}>⏱ {a.duration}</div><div style={{ color: T.muted, fontSize: 12, lineHeight: 1.5 }}>{a.description}</div></div>)}</Card>
          <Card><CardTitle>❓ Quick Quiz</CardTitle>{plan.quiz?.map((q, i) => <div key={i} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", marginBottom: 7 }}><div style={{ color: T.txt, fontSize: 12, fontWeight: 600, marginBottom: 7 }}>Q{i + 1}: {q.q}</div>{q.options?.map((opt, oi) => <div key={oi} style={{ fontSize: 11, color: oi === q.answer ? T.green : T.muted, fontWeight: oi === q.answer ? 700 : 400 }}>{oi === q.answer ? "✅" : "○"} {String.fromCharCode(65 + oi)}) {opt}</div>)}</div>)}</Card>
        </div>
        <Card><CardTitle>📝 Summary</CardTitle><p style={{ color: T.txt, lineHeight: 1.75, fontSize: 14, marginBottom: 10 }}>{plan.summary}</p><div style={{ background: T.bg, borderRadius: 10, padding: "10px 14px", border: `1px solid ${T.border}` }}><span style={{ color: T.green, fontWeight: 700 }}>📚 Homework: </span><span style={{ color: T.txt, fontSize: 13 }}>{plan.homework}</span></div></Card>
      </div>)}
    </div>
  );
}

function QuizPanel() {
  const [topic, setTopic] = useState(""); const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({}); const [submitted, setSubmitted] = useState(false); const [loading, setLoading] = useState(false);
  const generate = async () => {
    if (!topic.trim() || loading) return; setLoading(true); setQuiz(null); setAnswers({}); setSubmitted(false);
    // Try offline quiz first, then API
    const offlineQuiz = findOfflineQuiz(topic);
    if (offlineQuiz) {
      await new Promise(r => setTimeout(r, 600)); // brief loading feel
      setQuiz(offlineQuiz); setLoading(false); return;
    }
    try { const raw = await callAI(`Generate 5 MCQ questions about: ${topic}\nReturn ONLY JSON array (no backticks):\n[{"q":"...","options":["A text","B text","C text","D text"],"answer":0,"explanation":"reason"}]`); setQuiz(JSON.parse(raw.replace(/```json|```/g, "").trim())); } catch (e) { alert("Error: " + e.message); } setLoading(false);
  };
  const score = quiz && submitted ? quiz.filter((q, i) => answers[i] === q.answer).length : 0;
  return (
    <div style={{ padding: 24, height: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}><span style={{ fontSize: 32 }}>🎯</span><div><div style={{ color: T.txt, fontSize: 20, fontWeight: 700 }}>AI Quiz Generator</div><div style={{ color: T.muted, fontSize: 12 }}>Dynamic MCQ quiz on any topic</div></div></div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}><Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic (e.g. Solar System, Algebra…)" onKeyDown={e => e.key === "Enter" && generate()} style={{ flex: 1 }} /><PrimaryBtn onClick={generate} disabled={loading || !topic.trim()} style={{ whiteSpace: "nowrap" }}>{loading ? "⏳" : "🎲 Generate"}</PrimaryBtn></div>
      {loading && <Spinner />}
      {quiz && !loading && (<div style={{ animation: "fadeSlide .4s ease" }}>
        {submitted && <Card style={{ marginBottom: 18, textAlign: "center", borderColor: score >= 4 ? T.green : score >= 3 ? T.amber : T.red, background: score >= 4 ? "#001a0a" : score >= 3 ? "#1a1000" : "#1a0000" }}><div style={{ fontSize: 40, marginBottom: 8 }}>{score >= 4 ? "🏆" : score >= 3 ? "👍" : "📚"}</div><div style={{ color: T.txt, fontSize: 24, fontWeight: 800 }}>Score: {score}/{quiz.length}</div><div style={{ color: T.muted, fontSize: 13, marginTop: 5 }}>{score === 5 ? "Perfect!" : score >= 4 ? "Excellent!" : score >= 3 ? "Good work!" : "Keep studying!"}</div></Card>}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {quiz.map((q, qi) => {
            const iC = answers[qi] === q.answer; return (
              <Card key={qi} style={{ borderColor: submitted ? (iC ? T.green : answers[qi] !== undefined ? T.red : T.border) : T.border }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}><Tag label={`Q${qi + 1}`} />{submitted && answers[qi] !== undefined && <Tag label={iC ? "✓ Correct" : "✗ Wrong"} color={iC ? T.green : T.red} />}</div>
                <div style={{ color: T.txt, fontSize: 15, fontWeight: 600, lineHeight: 1.5, marginBottom: 12 }}>{q.q}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {q.options.map((opt, oi) => {
                    const sel = answers[qi] === oi, cor = submitted && oi === q.answer, wrong = submitted && sel && oi !== q.answer; return (
                      <button key={oi} disabled={submitted} onClick={() => setAnswers(p => ({ ...p, [qi]: oi }))}
                        style={{ padding: "9px 12px", textAlign: "left", cursor: submitted ? "default" : "pointer", border: `1px solid ${cor ? T.green : wrong ? T.red : sel ? T.cyan : T.border}`, borderRadius: 10, fontFamily: "Rajdhani,sans-serif", fontSize: 13, fontWeight: 500, background: cor ? `${T.green}12` : wrong ? `${T.red}12` : sel ? `${T.cyan}12` : T.bg, color: cor ? T.green : wrong ? T.red : sel ? T.cyan : T.txt, transition: "all .15s" }}
                        onMouseEnter={e => { if (!submitted) e.currentTarget.style.borderColor = T.cyan; }}
                        onMouseLeave={e => { if (!submitted && answers[qi] !== oi) e.currentTarget.style.borderColor = T.border; }}>
                        <span style={{ fontWeight: 700, marginRight: 5 }}>{String.fromCharCode(65 + oi)}.</span>{opt}
                      </button>);
                  })}
                </div>
                {submitted && q.explanation && <div style={{ marginTop: 10, padding: "9px 12px", background: `${T.cyan}08`, border: `1px solid ${T.cyanDim}`, borderRadius: 8 }}><span style={{ color: T.cyan, fontWeight: 700 }}>💡 </span><span style={{ color: T.muted, fontSize: 12 }}>{q.explanation}</span></div>}
              </Card>);
          })}
        </div>
        {!submitted && Object.keys(answers).length === quiz.length && <PrimaryBtn onClick={() => setSubmitted(true)} style={{ width: "100%", marginTop: 14, background: `linear-gradient(135deg,#1a5c30,#0a2515)`, borderColor: T.green, color: T.green }}>✅ Submit Quiz</PrimaryBtn>}
        {submitted && <PrimaryBtn onClick={() => { setSubmitted(false); setAnswers({}); }} style={{ width: "100%", marginTop: 14 }}>🔄 Retake</PrimaryBtn>}
      </div>)}
    </div>
  );
}

function SolarPanel() {
  const mountRef = useRef(null); const [selected, setSelected] = useState(null); const [tooltip, setTooltip] = useState(null);
  const targetRef = useRef({ rotY: 0, rotX: .3, zoom: 38 }); const currentRef = useRef({ rotY: 0, rotX: .3, zoom: 38 });
  const dragRef = useRef({ dragging: false, prevX: 0, prevY: 0 }); const animRef = useRef(null);
  useEffect(() => {
    const container = mountRef.current; if (!container) return; const W = container.clientWidth, H = container.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); renderer.setSize(W, H); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setClearColor(0x010408, 1); container.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(55, W / H, .1, 2000);
    // Star layers with parallax grouping
    const starGroups = [];
    for (let l = 0; l < 3; l++) { const g = new THREE.BufferGeometry(); const v = []; const c = [5000, 2500, 800][l], sp = [700, 350, 180][l]; for (let i = 0; i < c; i++) v.push((Math.random() - .5) * sp, (Math.random() - .5) * sp, (Math.random() - .5) * sp); g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: [0xaaccff, 0xffffff, 0xffeecc][l], size: [.12, .24, .4][l], transparent: true, opacity: [.4, .65, .95][l] })); scene.add(pts); starGroups.push({ pts, parallax: [.002, .005, .01][l] }); }
    // Sun core + glow layers
    const sunCore = new THREE.Mesh(new THREE.SphereGeometry(1.8, 48, 48), new THREE.MeshBasicMaterial({ color: 0xffe040 }));
    scene.add(sunCore);
    const sunGlows = [];
    [[2.2, 0xffcc00, .2], [2.8, 0xff8800, .1], [3.6, 0xff4400, .05], [5.0, 0xff2200, .02]].forEach(([r, c, o]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 32), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o })); scene.add(m); sunGlows.push(m); });
    // Corona rings
    const coronaRings = [];
    [3.0, 3.8, 4.5].forEach((r, i) => { const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + .15, 64), new THREE.MeshBasicMaterial({ color: [0xffee88, 0xffaa44, 0xff6622][i], side: THREE.DoubleSide, transparent: true, opacity: .08 })); ring.rotation.x = Math.PI / 2 + Math.random() * .3; ring.rotation.z = Math.random() * .5; scene.add(ring); coronaRings.push(ring); });
    // Lighting
    const sunLight = new THREE.PointLight(0xfff5dd, 4.0, 500); scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0x0a1530, 1.5));
    scene.add(new THREE.HemisphereLight(0x1a2a44, 0x050810, 0.6));
    // Asteroid belt (500 asteroids)
    const belt = new THREE.Group(); for (let i = 0; i < 500; i++) { const a = Math.random() * Math.PI * 2, r = 11.8 + Math.random() * 2.4, s = .03 + Math.random() * .12; const m = new THREE.Mesh(new THREE.SphereGeometry(s, 4, 4), new THREE.MeshLambertMaterial({ color: new THREE.Color().setHSL(.08, .15 + Math.random() * .15, .25 + Math.random() * .25) })); m.position.set(Math.cos(a) * r, (Math.random() - .5) * .7, Math.sin(a) * r); belt.add(m); } scene.add(belt);
    const meshes = [], pivots = [];
    // Axial tilts in radians
    const TILTS = { Mercury: .001, Venus: .05, Earth: .41, Mars: .44, Jupiter: .05, Saturn: .47, Uranus: 1.71, Neptune: .49 };
    // Atmosphere config
    const ATMOS = { Venus: [0xe8c060, .12, 1.18], Earth: [0x4488ff, .1, 1.15], Mars: [0xcc6644, .06, 1.12] };
    PLANETS.forEach((p, idx) => {
      const og = new THREE.BufferGeometry(); const ov = []; for (let i = 0; i <= 128; i++) { const a = (i / 128) * Math.PI * 2; ov.push(Math.cos(a) * p.dist, 0, Math.sin(a) * p.dist); } og.setAttribute("position", new THREE.Float32BufferAttribute(ov, 3)); scene.add(new THREE.Line(og, new THREE.LineBasicMaterial({ color: 0x1a3050, transparent: true, opacity: .4 })));
      const geo = new THREE.SphereGeometry(p.size, 48, 48); const c1 = new THREE.Color(p.colors[0]), c2 = new THREE.Color(p.colors[1]); const cols = []; const pa = geo.attributes.position.array; for (let i = 0; i < pa.length; i += 3) { const ny = (pa[i + 1] / p.size + 1) / 2; const c = c1.clone().lerp(c2, ny * .7); cols.push(c.r, c.g, c.b); } geo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
      const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true })); mesh.userData = { pi: idx };
      // Axial tilt
      mesh.rotation.z = TILTS[p.name] || 0;
      // Rings for Saturn
      if (p.ring) { [[p.size * 1.45, p.size * 2.35, 0xd4a855, .65], [p.size * 1.48, p.size * 1.82, 0x8a6020, .4], [p.size * 2.0, p.size * 2.3, 0xb89040, .25]].forEach(([ri, ro, c, o]) => { const rg = new THREE.Mesh(new THREE.RingGeometry(ri, ro, 80), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide, transparent: true, opacity: o })); rg.rotation.x = Math.PI / 2.5; mesh.add(rg); }); }
      // Earth enhancements: moon + cloud layer
      if (p.name === "Earth") { const moon = new THREE.Mesh(new THREE.SphereGeometry(.14, 16, 16), new THREE.MeshLambertMaterial({ color: 0xaaaaaa })); moon.position.set(p.size + .5, 0, 0); mesh.add(moon); const clouds = new THREE.Mesh(new THREE.SphereGeometry(p.size * 1.03, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .12, depthWrite: false })); mesh.add(clouds); mesh.userData.clouds = clouds; }
      // Atmosphere shell
      if (ATMOS[p.name]) { const [ac, ao, as] = ATMOS[p.name]; const atm = new THREE.Mesh(new THREE.SphereGeometry(p.size * as, 32, 32), new THREE.MeshBasicMaterial({ color: ac, transparent: true, opacity: ao, depthWrite: false })); mesh.add(atm); }
      // Hover halo
      const halo = new THREE.Mesh(new THREE.SphereGeometry(p.size * 1.4, 16, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(p.colors[0]), transparent: true, opacity: 0, depthWrite: false })); mesh.add(halo); mesh.userData.halo = halo;
      const pivot = new THREE.Group(); pivot.rotation.y = Math.random() * Math.PI * 2; mesh.position.set(p.dist, 0, 0); pivot.add(mesh); scene.add(pivot);
      meshes.push(mesh); pivots.push({ pivot, speed: p.speed, mesh });
    });
    const ray = new THREE.Raycaster(); const mouse = new THREE.Vector2();
    const onClick = e => { const rect = renderer.domElement.getBoundingClientRect(); mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1; mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1; ray.setFromCamera(mouse, camera); const hits = ray.intersectObjects(meshes, false); if (hits.length) { const i = hits[0].object.userData.pi; const p = PLANETS[i]; setSelected(p); const wp = new THREE.Vector3(); hits[0].object.getWorldPosition(wp); const a = Math.atan2(wp.z, wp.x); targetRef.current.rotY = -a; targetRef.current.rotX = .18; targetRef.current.zoom = p.dist + p.size * 5 + 4; } };
    const onMove = e => { const rect = renderer.domElement.getBoundingClientRect(); mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1; mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1; ray.setFromCamera(mouse, camera); const hits = ray.intersectObjects(meshes, false); if (hits.length) { const i = hits[0].object.userData.pi; setTooltip({ name: PLANETS[i].name, x: e.clientX, y: e.clientY }); renderer.domElement.style.cursor = "pointer"; meshes.forEach((m, mi) => { if (m.userData.halo) m.userData.halo.material.opacity = mi === i ? .22 : 0; }); } else { setTooltip(null); renderer.domElement.style.cursor = "grab"; meshes.forEach(m => { if (m.userData.halo) m.userData.halo.material.opacity = 0; }); } };
    const onDown = e => { dragRef.current = { dragging: true, prevX: e.clientX, prevY: e.clientY }; renderer.domElement.style.cursor = "grabbing"; };
    const onUp = () => { dragRef.current.dragging = false; renderer.domElement.style.cursor = "grab"; };
    const onDrag = e => { if (!dragRef.current.dragging) return; targetRef.current.rotY += (e.clientX - dragRef.current.prevX) * .005; targetRef.current.rotX = Math.max(-.7, Math.min(.7, targetRef.current.rotX + (e.clientY - dragRef.current.prevY) * .003)); dragRef.current.prevX = e.clientX; dragRef.current.prevY = e.clientY; };
    const onWheel = e => { targetRef.current.zoom = Math.max(8, Math.min(80, targetRef.current.zoom + e.deltaY * .04)); };
    renderer.domElement.addEventListener("click", onClick); renderer.domElement.addEventListener("mousemove", onMove); renderer.domElement.addEventListener("mousedown", onDown); window.addEventListener("mouseup", onUp); window.addEventListener("mousemove", onDrag); renderer.domElement.addEventListener("wheel", onWheel, { passive: true });
    let frameCount = 0;
    const animate = () => {
      animRef.current = requestAnimationFrame(animate); frameCount++;
      currentRef.current.rotY += (targetRef.current.rotY - currentRef.current.rotY) * .06; currentRef.current.rotX += (targetRef.current.rotX - currentRef.current.rotX) * .06; currentRef.current.zoom += (targetRef.current.zoom - currentRef.current.zoom) * .07;
      const { rotY, rotX, zoom } = currentRef.current;
      camera.position.set(Math.sin(rotY) * Math.cos(rotX) * zoom, Math.sin(rotX) * zoom, Math.cos(rotY) * Math.cos(rotX) * zoom); camera.lookAt(0, 0, 0);
      // Star parallax
      starGroups.forEach(({ pts, parallax }) => { pts.rotation.y = rotY * parallax; pts.rotation.x = rotX * parallax * .5; });
      // Sun pulsation
      const pulse = Math.sin(frameCount * .02) * .08;
      sunCore.scale.setScalar(1 + pulse * .15);
      sunGlows.forEach((g, i) => { g.material.opacity = [.2, .1, .05, .02][i] + pulse * [.08, .04, .02, .01][i]; });
      coronaRings.forEach((r, i) => { r.rotation.z += [.001, -.0008, .0006][i]; r.material.opacity = .06 + Math.sin(frameCount * .015 + i) * .04; });
      // Planet orbits + rotation
      pivots.forEach(({ pivot, speed, mesh }) => { pivot.rotation.y += speed * .01; mesh.rotation.y += .008; if (mesh.userData.clouds) mesh.userData.clouds.rotation.y += .003; });
      belt.rotation.y += .0008;
      renderer.render(scene, camera);
    }; animate();
    return () => { cancelAnimationFrame(animRef.current); renderer.domElement.removeEventListener("click", onClick); renderer.domElement.removeEventListener("mousemove", onMove); renderer.domElement.removeEventListener("mousedown", onDown); window.removeEventListener("mouseup", onUp); window.removeEventListener("mousemove", onDrag); renderer.domElement.removeEventListener("wheel", onWheel); if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement); renderer.dispose(); };
  }, []);
  const focusPlanet = (idx) => { const p = PLANETS[idx]; setSelected(p); targetRef.current.zoom = p.dist + p.size * 5 + 4; targetRef.current.rotX = .15; };
  const resetCamera = () => { targetRef.current = { rotY: 0, rotX: .3, zoom: 38 }; setSelected(null); };
  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div ref={mountRef} style={{ flex: 1, minWidth: 0, minHeight: 0, position: "relative" }}>
        <div style={{ position: "absolute", top: 14, left: 14, zIndex: 5, display: "flex", gap: 8 }}>
          <div style={{ background: "rgba(4,7,13,.88)", border: `1px solid ${T.border}`, borderRadius: 20, padding: "6px 14px", color: T.muted, fontSize: 11 }}>🖱️ Drag · Scroll · Click planet</div>
          <button onClick={resetCamera} style={{ background: "rgba(4,7,13,.88)", border: `1px solid ${T.border}`, borderRadius: 20, padding: "6px 14px", color: T.muted, fontSize: 11, cursor: "pointer", fontFamily: "Rajdhani,sans-serif" }} onMouseEnter={e => e.target.style.color = T.cyan} onMouseLeave={e => e.target.style.color = T.muted}>↩ Reset</button>
        </div>
        <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5, zIndex: 5, flexWrap: "wrap", justifyContent: "center", maxWidth: "90%" }}>
          {PLANETS.map((p, i) => <button key={p.name} onClick={() => focusPlanet(i)} style={{ background: "rgba(4,7,13,.85)", border: `1px solid ${selected?.name === p.name ? T.cyan : T.border}`, borderRadius: 20, color: selected?.name === p.name ? T.cyan : T.muted, padding: "5px 11px", fontSize: 11, cursor: "pointer", fontFamily: "Rajdhani,sans-serif", fontWeight: 600, whiteSpace: "nowrap" }} onMouseEnter={e => { e.currentTarget.style.borderColor = T.cyan; e.currentTarget.style.color = T.cyan; }} onMouseLeave={e => { if (selected?.name !== p.name) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; } }}>{p.name}</button>)}
        </div>
        {tooltip && <div style={{ position: "fixed", left: tooltip.x + 16, top: tooltip.y - 10, background: "rgba(4,7,13,.95)", border: `1px solid ${T.cyan}55`, borderRadius: 10, padding: "8px 14px", color: T.txt, fontSize: 13, fontWeight: 700, pointerEvents: "none", zIndex: 9999, whiteSpace: "nowrap" }}>🪐 {tooltip.name}<br /><span style={{ color: T.muted, fontSize: 11, fontWeight: 400 }}>Click for details</span></div>}
      </div>
      <div style={{ width: 284, borderLeft: `1px solid ${T.border}`, background: T.surf, overflowY: "auto", flexShrink: 0 }}>
        {selected ? (
          <div style={{ padding: 18, animation: "fadeSlide .3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}><div style={{ color: T.cyan, fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}><span>{selected.emoji}</span>{selected.name}</div><button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 20 }}>✕</button></div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><div style={{ width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle at 35% 35%,${selected.colors[0]},${selected.colors[1]})`, boxShadow: `0 0 28px ${selected.colors[0]}55`, position: "relative" }}>{selected.ring && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) rotateX(70deg)", width: 130, height: 130, borderRadius: "50%", border: "8px solid rgba(212,168,85,.45)", pointerEvents: "none" }} />}</div></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>{Object.entries(selected.info).map(([k, v]) => <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 11px", background: T.surf2, borderRadius: 9, border: `1px solid ${T.border}`, gap: 8 }}><span style={{ color: T.muted, fontSize: 10, fontWeight: 700, letterSpacing: .5, flexShrink: 0 }}>{k.toUpperCase()}</span><span style={{ color: T.txt, fontSize: 11, fontWeight: 700, textAlign: "right" }}>{v}</span></div>)}</div>
            <div style={{ padding: "11px 13px", background: `${T.cyan}08`, border: `1px solid ${T.cyanDim}`, borderRadius: 9, marginBottom: 12 }}><div style={{ color: T.cyan, fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>💡 DID YOU KNOW?</div><div style={{ color: T.muted, fontSize: 11, lineHeight: 1.65 }}>{selected.fact}</div></div>
            <div style={{ display: "flex", gap: 7 }}>{[["← Prev", () => { const i = PLANETS.findIndex(p => p.name === selected.name); focusPlanet((i - 1 + PLANETS.length) % PLANETS.length); }], ["Next →", () => { const i = PLANETS.findIndex(p => p.name === selected.name); focusPlanet((i + 1) % PLANETS.length); }]].map(([l, fn]) => <button key={l} onClick={fn} style={{ flex: 1, background: T.surf2, border: `1px solid ${T.border}`, borderRadius: 7, color: T.muted, padding: "7px 0", fontSize: 12, cursor: "pointer", fontFamily: "Rajdhani,sans-serif", fontWeight: 600, transition: "all .15s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = T.cyan; e.currentTarget.style.color = T.cyan; }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}>{l}</button>)}</div>
          </div>
        ) : (
          <div style={{ padding: 18 }}><div style={{ color: T.txt, fontSize: 13, fontWeight: 700, marginBottom: 12, letterSpacing: .5 }}>🌌 SOLAR SYSTEM</div><div style={{ color: T.muted, fontSize: 11, lineHeight: 1.6, marginBottom: 12 }}>Click a planet in 3D view or select below.</div>{PLANETS.map((p, i) => <div key={p.name} onClick={() => focusPlanet(i)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: T.surf2, border: `1px solid ${T.border}`, borderRadius: 9, cursor: "pointer", marginBottom: 6, transition: "all .15s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = T.cyan; e.currentTarget.style.background = `${T.cyan}08`; }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surf2; }}><div style={{ width: 18, height: 18, borderRadius: "50%", background: `radial-gradient(circle at 35% 35%,${p.colors[0]},${p.colors[1]})`, flexShrink: 0, boxShadow: `0 0 7px ${p.colors[0]}66` }} /><div style={{ flex: 1 }}><div style={{ color: T.txt, fontSize: 12, fontWeight: 600 }}>{p.name}</div><div style={{ color: T.muted, fontSize: 10 }}>{p.info.Diameter}</div></div><span style={{ fontSize: 16 }}>{p.emoji}</span></div>)}</div>
        )}
      </div>
    </div>
  );
}

function WhiteboardPanel() {
  const canvasRef = useRef(null);
  const [mode, setMode] = useState("smart");
  const [color, setColor] = useState("#00d4ff");
  const [size, setSize] = useState(3);
  const [notice, setNotice] = useState("");
  const isDrawing = useRef(false);
  const pts = useRef([]);
  const COLORS = ["#00d4ff", "#00ff88", "#ffaa00", "#ff4d88", "#ffffff", "#ff6b35", "#aa88ff"];
  const SIZES = [2, 4, 7, 11];

  const initCanvas = useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    c.width = c.offsetWidth; c.height = c.offsetHeight;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#030810"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "rgba(0,140,255,.06)"; ctx.lineWidth = 1;
    for (let x = 0; x < c.width; x += 44) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, c.height); ctx.stroke(); }
    for (let y = 0; y < c.height; y += 44) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(c.width, y); ctx.stroke(); }
  }, []);

  useEffect(() => {
    const t = setTimeout(initCanvas, 50);
    return () => clearTimeout(t);
  }, [initCanvas]);

  const getXY = (e, c) => { const r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) }; };
  const detectShape = p => { if (p.length < 8) return null; const xs = p.map(x => x.x), ys = p.map(y => y.y); const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys); const W = maxX - minX, H = maxY - minY; if (W < 15 || H < 15) return null; const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2; const dists = p.map(pt => Math.sqrt((pt.x - cx) ** 2 + (pt.y - cy) ** 2)); const avg = dists.reduce((a, b) => a + b) / dists.length; if (dists.reduce((acc, d) => acc + (d - avg) ** 2, 0) / dists.length / (avg * avg) < .07 && avg > 10) return { type: "circle", cx, cy, r: avg }; if (Math.sqrt((p[0].x - p[p.length - 1].x) ** 2 + (p[0].y - p[p.length - 1].y) ** 2) / (W + H) * 2 < .25 && p.length < 80) { if (W / H > .6 && W / H < 1.7) return { type: "rectangle", minX, minY, W, H }; return { type: "triangle", minX, minY, maxX, maxY }; } return null; };
  const onDown = e => { isDrawing.current = true; pts.current = []; const c = canvasRef.current; if (!c) return; pts.current.push(getXY(e, c)); };
  const onMove = e => { if (!isDrawing.current || !canvasRef.current) return; const c = canvasRef.current, ctx = c.getContext("2d"), pt = getXY(e, c); pts.current.push(pt); const prev = pts.current[pts.current.length - 2]; if (prev) { ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(pt.x, pt.y); ctx.stroke(); } };
  const onUp = () => { if (!isDrawing.current) return; isDrawing.current = false; if (mode === "smart" && pts.current.length > 8) { const shape = detectShape(pts.current); if (shape) { const c = canvasRef.current, ctx = c.getContext("2d"), pad = 20; ctx.fillStyle = "#030810"; ctx.fillRect(shape.minX || shape.cx - shape.r - pad, (shape.minY || shape.cy - shape.r - pad), (shape.W || (shape.r + pad) * 2), (shape.H || (shape.r + pad) * 2)); ctx.strokeStyle = "#00ff88"; ctx.lineWidth = 2.5; ctx.shadowColor = "#00ff88"; ctx.shadowBlur = 14; ctx.beginPath(); if (shape.type === "circle") ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2); else if (shape.type === "rectangle") ctx.rect(shape.minX, shape.minY, shape.W, shape.H); else { ctx.moveTo((shape.minX + shape.maxX) / 2, shape.minY); ctx.lineTo(shape.maxX, shape.maxY); ctx.lineTo(shape.minX, shape.maxY); ctx.closePath(); } ctx.stroke(); ctx.shadowBlur = 0; setNotice(`✨ ${shape.type.charAt(0).toUpperCase() + shape.type.slice(1)} perfected!`); setTimeout(() => setNotice(""), 2500); } } pts.current = []; };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "8px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 10, alignItems: "center", background: T.surf, flexShrink: 0 }}>
        {[["smart", "⚡ Smart Draw"], ["free", "✏️ Free Draw"]].map(([m, l]) => <button key={m} onClick={() => setMode(m)} style={{ background: mode === m ? `${T.cyan}18` : T.surf2, border: `1px solid ${mode === m ? T.cyan : T.border}`, borderRadius: 8, color: mode === m ? T.cyan : T.muted, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "Rajdhani,sans-serif", fontWeight: 600 }}>{l}</button>)}
        <div style={{ width: 1, height: 20, background: T.border, margin: "0 6px" }} />
        {COLORS.map(c => <button key={c} onClick={() => setColor(c)} style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: `2px solid ${color === c ? T.txt : "transparent"}`, cursor: "pointer", padding: 0, outline: `2px solid ${color === c ? c : "transparent"}`, outlineOffset: 2 }} />)}
        <div style={{ width: 1, height: 20, background: T.border, margin: "0 6px" }} />
        {SIZES.map(s => <button key={s} onClick={() => setSize(s)} style={{ width: s * 2 + 14, height: s * 2 + 14, borderRadius: "50%", background: size === s ? T.cyan : T.muted, border: `1px solid ${size === s ? T.cyan : T.border}`, cursor: "pointer" }} />)}
        <div style={{ flex: 1 }} />
        {notice && <div style={{ color: T.green, fontSize: 13, fontWeight: 600, animation: "fadeSlide .3s ease" }}>{notice}</div>}
        <button onClick={initCanvas} style={{ background: "rgba(255,77,77,.1)", border: `1px solid rgba(255,77,77,.4)`, borderRadius: 8, color: "#ff8888", padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "Rajdhani,sans-serif", fontWeight: 600 }}>🗑 Clear</button>
      </div>
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <canvas ref={canvasRef} data-wb="true" style={{ width: "100%", height: "100%", display: "block", cursor: "crosshair" }} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} />
        <div style={{ position: "absolute", bottom: 14, left: 14, background: "rgba(3,8,16,.9)", border: `1px solid ${T.border}`, borderRadius: 20, padding: "6px 14px", color: T.muted, fontSize: 11, pointerEvents: "none" }}>
          {mode === "smart" ? "⚡ Smart Draw — draw rough shapes to snap to perfect geometry" : "✏️ Free Draw mode"}
        </div>
      </div>
    </div>
  );
}

function AnalyticsPanel() {
  const heatmap = useMemo(() => Array.from({ length: 24 }, () => Math.random()), []);
  const timeline = useMemo(() => Array.from({ length: 16 }, (_, i) => ({ t: i * 5, att: 65 + Math.sin(i * .4) * 20 + Math.random() * 8, eng: 70 + Math.cos(i * .3) * 15 + Math.random() * 6 })), []);
  const stats = [{ label: "Students Present", val: 24, icon: "👥", color: T.cyan, note: "+2 from yesterday" }, { label: "Attention Rate", val: "87%", icon: "👁️", color: T.green, note: "Above class avg" }, { label: "Raised Hands", val: 7, icon: "✋", color: T.amber, note: "Last 5 minutes" }, { label: "Engagement", val: "92%", icon: "⚡", color: T.purple, note: "High energy" }];
  const responses = { A: 8, B: 12, C: 6, D: 4 }; const maxR = Math.max(...Object.values(responses)); const totalR = Object.values(responses).reduce((a, b) => a + b, 0); const barColors = { A: T.green, B: T.cyan, C: T.amber, D: "#ff7788" };
  return (<div style={{ padding: 24, height: "100%", overflowY: "auto" }}><div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}><span style={{ fontSize: 32 }}>📊</span><div><div style={{ color: T.txt, fontSize: 20, fontWeight: 700 }}>Classroom Analytics</div><div style={{ color: T.muted, fontSize: 12 }}>Real-time engagement · MediaPipe face & gesture detection</div></div><div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, background: `${T.green}18`, border: `1px solid ${T.green}44`, padding: "6px 14px", borderRadius: 20 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: T.green, animation: "pulse 1.5s ease-in-out infinite" }} /><span style={{ color: T.green, fontSize: 12, fontWeight: 700 }}>LIVE</span></div></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>{stats.map(s => <Card key={s.label} style={{ textAlign: "center", position: "relative", overflow: "hidden" }}><div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${s.color},transparent)` }} /><div style={{ fontSize: 26, marginBottom: 7 }}>{s.icon}</div><div style={{ color: s.color, fontSize: 26, fontWeight: 800, fontFamily: "Inconsolata,monospace" }}>{s.val}</div><div style={{ color: T.muted, fontSize: 10, marginTop: 4 }}>{s.label}</div><div style={{ color: s.color, fontSize: 9, marginTop: 4, opacity: .7 }}>{s.note}</div></Card>)}</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
      <Card><CardTitle>📊 Response Cards</CardTitle><div style={{ display: "flex", gap: 14, alignItems: "flex-end", height: 130 }}>{Object.entries(responses).map(([opt, count]) => <div key={opt} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, height: "100%", justifyContent: "flex-end" }}><div style={{ color: barColors[opt], fontSize: 12, fontWeight: 700 }}>{count}</div><div style={{ width: "100%", height: `${(count / maxR) * 105}px`, background: `linear-gradient(to top,${barColors[opt]}bb,${barColors[opt]}33)`, border: `1px solid ${barColors[opt]}88`, borderRadius: "5px 5px 0 0", position: "relative" }}><div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: barColors[opt], boxShadow: `0 0 8px ${barColors[opt]}` }} /></div><div style={{ color: T.txt, fontWeight: 700, fontSize: 16 }}>{opt}</div><div style={{ color: T.muted, fontSize: 10 }}>{((count / totalR) * 100).toFixed(0)}%</div></div>)}</div></Card>
      <Card><CardTitle>📈 Engagement Timeline</CardTitle><div style={{ position: "relative", height: 130 }}><svg width="100%" height="100%" viewBox={`0 0 ${timeline.length * 16} 100`} preserveAspectRatio="none"><polyline points={timeline.map((d, i) => `${i * 16},${100 - d.att}`).join(" ")} fill="none" stroke={T.cyan} strokeWidth="1.5" /><polyline points={timeline.map((d, i) => `${i * 16},${100 - d.eng}`).join(" ")} fill="none" stroke={T.green} strokeWidth="1.5" /></svg></div><div style={{ display: "flex", gap: 12, marginTop: 7 }}>{[[T.cyan, "Attention"], [T.green, "Engagement"]].map(([c, l]) => <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 16, height: 2, background: c, borderRadius: 1 }} /><span style={{ color: T.muted, fontSize: 10 }}>{l}</span></div>)}</div></Card>
    </div>
    <Card><CardTitle>🔥 Student Engagement Heatmap</CardTitle><div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 5 }}>{heatmap.map((level, i) => { const c = level > .75 ? T.green : level > .5 ? T.cyan : level > .3 ? T.amber : T.red; return <div key={i} style={{ height: 48, borderRadius: 7, background: `${c}${Math.round((.15 + level * .55) * 255).toString(16).padStart(2, "0")}`, border: `1px solid ${c}33`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2 }}><div style={{ fontSize: 9, color: `${c}cc`, fontWeight: 700 }}>S{i + 1}</div><div style={{ fontSize: 9, color: `${c}99` }}>{(level * 100).toFixed(0)}%</div></div>; })}</div></Card></div>);
}

function VoicePanel({ onNavigate }) {
  const [active, setActive] = useState(false); const [transcript, setTranscript] = useState(""); const [cmdLog, setCmdLog] = useState([]); const recRef = useRef(null);
  const COMMANDS = [{ cmd: '"Start quiz"', action: "Opens Quiz Generator", icon: "🎯" }, { cmd: '"Explain [topic]"', action: "Opens AI Assistant", icon: "🤖" }, { cmd: '"Generate lesson"', action: "Opens Lesson Planner", icon: "📋" }, { cmd: '"Show solar system"', action: "Opens Solar System", icon: "🪐" }, { cmd: '"Open whiteboard"', action: "Opens Whiteboard", icon: "✏️" }, { cmd: '"Show analytics"', action: "Opens Analytics", icon: "📊" }, { cmd: '"Show diagram"', action: "Opens AI Diagrams", icon: "🎨" }];
  const toggle = () => { if (active) { recRef.current?.stop(); setActive(false); return; } const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) { setCmdLog(p => [{ t: new Date().toLocaleTimeString(), text: "❌ Web Speech API not available", type: "error" }, ...p]); return; } const rec = new SR(); rec.continuous = true; rec.interimResults = true; rec.lang = "en-US"; rec.onresult = e => { const text = Array.from(e.results).map(r => r[0].transcript).join(""); setTranscript(text); if (e.results[e.results.length - 1].isFinal) { const cmd = text.toLowerCase().trim(); let route = null, log = text; if (cmd.includes("quiz")) route = "quiz"; else if (cmd.includes("lesson")) route = "lesson"; else if (cmd.includes("solar") || cmd.includes("planet")) route = "solar"; else if (cmd.includes("whiteboard") || cmd.includes("draw")) route = "whiteboard"; else if (cmd.includes("analytics")) route = "analytics"; else if (cmd.includes("explain") || cmd.includes("assistant")) route = "assistant"; else if (cmd.includes("diagram")) route = "diagram"; if (route) { onNavigate(route); log += ` → ${route}`; } setCmdLog(p => [{ t: new Date().toLocaleTimeString(), text: log, type: route ? "success" : "info" }, ...p.slice(0, 9)]); setTranscript(""); } }; rec.onerror = () => setActive(false); rec.onend = () => setActive(false); recRef.current = rec; rec.start(); setActive(true); };
  return (<div style={{ padding: 24, height: "100%", overflowY: "auto" }}><div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 26 }}><span style={{ fontSize: 32 }}>🎙️</span><div><div style={{ color: T.txt, fontSize: 20, fontWeight: 700 }}>Voice Command Center</div><div style={{ color: T.muted, fontSize: 12 }}>Control the classroom AI with your voice · Browser Web Speech API</div></div></div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 0" }}><button onClick={toggle} style={{ width: 128, height: 128, borderRadius: "50%", background: active ? `radial-gradient(circle,#aa2200,#550800)` : `radial-gradient(circle,${T.cyanDim},#002233)`, border: `3px solid ${active ? "#ff4444" : T.cyan}`, boxShadow: active ? `0 0 40px #ff444488` : `0 0 25px ${T.cyanDim}66`, cursor: "pointer", fontSize: 42, transition: "all .3s ease", animation: active ? "glow 1.2s ease-in-out infinite" : "none" }}>{active ? "🛑" : "🎙️"}</button>
      <div style={{ color: active ? "#ff8888" : T.muted, marginTop: 18, fontSize: 15, fontWeight: 600 }}>{active ? "🔴 LISTENING — Speak a command" : "Tap to activate voice control"}</div>
      {active && <div style={{ display: "flex", gap: 5, marginTop: 16, alignItems: "center" }}>{[...Array(7)].map((_, i) => <div key={i} style={{ width: 5, background: `hsl(${i * 20 + 200},100%,60%)`, borderRadius: 3, animation: `wave .6s ease-in-out ${i * .1}s infinite` }} />)}</div>}
      {transcript && <div style={{ marginTop: 18, padding: "12px 22px", background: T.surf2, border: `1px solid ${T.border}`, borderRadius: 14, maxWidth: 400, textAlign: "center" }}><div style={{ color: T.muted, fontSize: 10, letterSpacing: 1, marginBottom: 5 }}>TRANSCRIBING…</div><div style={{ color: T.txt, fontSize: 16, fontStyle: "italic" }}>"{transcript}"</div></div>}</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}><Card><CardTitle>🗣️ Commands</CardTitle>{COMMANDS.map(({ cmd, action, icon }) => <div key={cmd} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", background: T.bg, borderRadius: 9, border: `1px solid ${T.border}`, marginBottom: 6 }}><span style={{ fontSize: 16 }}>{icon}</span><div><div style={{ color: T.cyan, fontFamily: "Inconsolata,monospace", fontSize: 11, fontWeight: 700 }}>{cmd}</div><div style={{ color: T.muted, fontSize: 10, marginTop: 1 }}>→ {action}</div></div></div>)}</Card>
      <Card><CardTitle>📝 Command Log</CardTitle>{cmdLog.length === 0 ? <div style={{ color: T.muted, fontSize: 12, textAlign: "center", padding: 18 }}>No commands yet. Activate the mic!</div> : cmdLog.map((log, i) => <div key={i} style={{ padding: "7px 10px", background: T.bg, borderRadius: 7, border: `1px solid ${log.type === "success" ? T.green + "44" : log.type === "error" ? T.red + "44" : T.border}`, marginBottom: 5 }}><div style={{ color: T.muted, fontSize: 9, marginBottom: 1 }}>{log.t}</div><div style={{ color: log.type === "success" ? T.green : log.type === "error" ? T.red : T.txt, fontSize: 11 }}>{log.text}</div></div>)}</Card></div></div>);
}

/* ═══════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════ */
const TABS = [
  { id: "assistant", icon: "🤖", label: "AI Assistant" },
  { id: "lesson", icon: "📋", label: "Lesson Planner" },
  { id: "quiz", icon: "🎯", label: "Quiz Generator" },
  { id: "solar", icon: "🪐", label: "Solar System" },
  { id: "whiteboard", icon: "✏️", label: "Whiteboard" },
  { id: "analytics", icon: "📊", label: "Analytics" },
  { id: "voice", icon: "🎙️", label: "Voice Commands" },
  { id: "diagram", icon: "🎨", label: "AI Diagrams" },
];

export default function SmartClassroom() {
  const [tab, setTab] = useState("assistant");
  const [clock, setClock] = useState(new Date());
  const [gestureEnabled, setGestureEnabled] = useState(false);

  const handleGestureToggle = useCallback(() => setGestureEnabled(p => !p), []);

  useEffect(() => {
    const style = document.createElement("style"); style.textContent = GLOBAL_CSS; document.head.appendChild(style);
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ fontFamily: "Rajdhani,sans-serif", background: T.bg, color: T.txt, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <header style={{ background: `linear-gradient(90deg,rgba(8,14,28,.92),rgba(8,20,40,.92))`, backdropFilter: "blur(16px)", borderBottom: `1px solid ${T.border}`, height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg,${T.cyanDim},#001830)`, border: `1px solid ${T.cyan}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: `0 0 12px ${T.cyan}22`, animation: "breathe 4s ease-in-out infinite" }}>⬡</div>
          <div><div style={{ color: T.txt, fontWeight: 800, fontSize: 16, letterSpacing: 3, lineHeight: 1 }}>NOVA CLASSROOM AI</div><div style={{ color: T.muted, fontSize: 9, letterSpacing: 2, marginTop: 2, opacity: .7 }}>SMART WHITEBOARD v2.0</div></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={handleGestureToggle} style={{
            display: "flex", alignItems: "center", gap: 6, background: gestureEnabled ? `${T.green}15` : "rgba(255,255,255,.04)",
            border: `1px solid ${gestureEnabled ? T.green + "66" : T.border}`, borderRadius: 20,
            color: gestureEnabled ? T.green : T.muted, padding: "5px 12px", fontSize: 11, cursor: "pointer",
            fontFamily: "Rajdhani,sans-serif", fontWeight: 700, transition: "all .3s", letterSpacing: .5,
          }}>
            <span style={{ fontSize: 13 }}>{gestureEnabled ? "🖐️" : "✋"}</span>
            {gestureEnabled ? "Gestures: ON" : "Gestures: OFF"}
          </button>
          {[[T.cyan, "AI"], [T.green, "LIVE"], [T.amber, "SENSORS"]].map(([c, l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 4, background: `${c}0a`, border: `1px solid ${c}33`, borderRadius: 16, padding: "3px 9px" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: c, animation: "pulse 2.5s ease-in-out infinite" }} />
              <span style={{ color: c, fontSize: 9, fontWeight: 700, letterSpacing: .8 }}>{l}</span>
            </div>
          ))}
          <div style={{ color: T.muted, fontSize: 12, fontFamily: "Inconsolata,monospace", fontWeight: 700, opacity: .8 }}>{clock.toLocaleTimeString()}</div>
        </div>
      </header>

      {/* Nav */}
      <nav style={{ background: "rgba(8,14,28,.6)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${T.border}`, display: "flex", padding: "0 12px", flexShrink: 0, overflowX: "auto", gap: 1 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", background: tab === t.id ? `${T.cyan}0a` : "none", border: "none", cursor: "pointer", color: tab === t.id ? T.cyan : T.muted, borderBottom: `2px solid ${tab === t.id ? T.cyan : "transparent"}`, fontFamily: "Rajdhani,sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: .5, whiteSpace: "nowrap", transition: "all .2s ease", animation: tab === t.id ? "tabSlide .25s ease" : "none" }}
            onMouseEnter={e => { if (tab !== t.id) { e.currentTarget.style.color = T.txt; e.currentTarget.style.background = `${T.cyan}06`; } }}
            onMouseLeave={e => { if (tab !== t.id) { e.currentTarget.style.color = T.muted; e.currentTarget.style.background = "none"; } }}>
            <span style={{ fontSize: 13 }}>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Main */}
      <main style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {tab === "assistant" && <AssistantPanel />}
        {tab === "lesson" && <LessonPanel />}
        {tab === "quiz" && <QuizPanel />}
        {tab === "solar" && <SolarSystem />}
        {tab === "whiteboard" && <WhiteboardPanel />}
        {tab === "analytics" && <AnalyticsPanel />}
        {tab === "voice" && <VoicePanel onNavigate={setTab} />}
        {tab === "diagram" && <DiagramPanel />}
      </main>

      {/* Footer */}
      <footer style={{ height: 24, background: "rgba(8,14,28,.8)", backdropFilter: "blur(6px)", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 20px", gap: 16, flexShrink: 0 }}>
        {[["🤖", "Claude Sonnet", "Connected"], ["🎙️", "Speech API", "Active"], ["🖐️", "TF.js Handpose", gestureEnabled ? "Active" : "Standby"], ["🪐", "Three.js", "Rendering"], ["⚡", "FastAPI", "Online"]].map(([ico, s, st]) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 9 }}>{ico}</span>
            <span style={{ color: T.dimTxt, fontSize: 9, fontWeight: 600 }}>{s}:</span>
            <span style={{ color: s === "TF.js Handpose" && !gestureEnabled ? T.amber : T.green, fontSize: 9, fontWeight: 600 }}>{st}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", color: T.dimTxt, fontSize: 9, fontFamily: "Inconsolata,monospace", opacity: .7 }}>NOVA AI CLASSROOM © 2026</div>
      </footer>

      {/* Hand Gesture Controller */}
      <HandGesturePanel
        onTabChange={setTab}
        currentTab={tab}
        tabIds={TABS.map(t => t.id)}
        enabled={gestureEnabled}
        onToggle={handleGestureToggle}
      />
    </div>
  );
}
