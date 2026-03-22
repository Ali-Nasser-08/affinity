export const unit8GrammarContent = {
    suchSoThat: {
        title: "Such…That / So…That",
        titleAr: "Such…That / So…That",
        introduction: {
            en: "Such and so make the meaning of an adjective or adverb stronger. Such…that and so…that are used to show cause and effect.",
            ar: "Such و so تجعل معنى الصفة أو الظرف أقوى. Such…that و so…that تُستخدم لإظهار السبب والنتيجة."
        },
        note: {
            en: "Note: That is frequently left out in casual speech.",
            ar: "ملاحظة: كلمة That كثيراً ما تُحذف في الكلام غير الرسمي.",
            example: "The book was so popular (that) it sold out within a week."
        },
        patterns: [
            {
                pattern: "such + adjective + noun + that",
                examples: [
                    "It was such a strange experience to see my old friend again that I was speechless.",
                    "Jake is such a determined person that he always manages to succeed."
                ]
            },
            {
                pattern: "so + adjective or adverb + that",
                examples: [
                    "Finding my keys on the beach was so unlikely that I was shocked when I spotted them.",
                    "He ran so quickly that he won the race."
                ]
            },
            {
                pattern: "so + many/few + plural count noun + that",
                examples: [
                    "We discovered so many similarities between our lives that it almost frightened us.",
                    "So few people were accepted into the school that it's amazing we both got in."
                ]
            },
            {
                pattern: "so + much/little + noncount noun + that",
                examples: [
                    "I have so much homework that I won't be able to go out tonight.",
                    "He had so little training that no one thought he would be accepted to the energy company."
                ]
            }
        ]
    },
    reducingAdverbClauses: {
        title: "Reducing Adverb Clauses",
        titleAr: "اختصار جمل الظرف",
        introduction: {
            en: "An adverb clause can be reduced to a participle phrase when the subject of the adverb clause and the subject of the main clause are the same. To do this, drop the subject in the adverb clause, and follow it with a gerund.",
            ar: "يمكن اختصار جملة الظرف إلى عبارة اسم فاعل عندما يكون فاعل جملة الظرف وفاعل الجملة الرئيسية متطابقين. للقيام بذلك، احذف الفاعل في جملة الظرف واتبعها بالاسم المشتق (gerund)."
        },
        examples: [
            {
                original: "After we met online, we discovered that we live in the same town.",
                reduced: "After meeting online, we discovered that we live in the same town."
            },
            {
                original: "I ran into him on the street while I was calling him on my cell phone.",
                reduced: "I ran into him on the street while calling him on my cell phone."
            }
        ]
    }
}

// 50 Examples for both grammars
export const unit8Examples = [
    // Such...that / So...that examples (30)
    { text: "It was such a beautiful day that we decided to have a picnic.", grammar: "Such...that", highlight: "such a beautiful day that" },
    { text: "She is such a talented singer that she won the competition.", grammar: "Such...that", highlight: "such a talented singer that" },
    { text: "The movie was so boring that I fell asleep.", grammar: "So...that", highlight: "so boring that" },
    { text: "He spoke so quickly that nobody understood him.", grammar: "So...that", highlight: "so quickly that" },
    { text: "There were so many people that we couldn't find a seat.", grammar: "So many...that", highlight: "so many people that" },
    { text: "She had so little time that she couldn't finish the project.", grammar: "So little...that", highlight: "so little time that" },
    { text: "It was such an exciting game that everyone cheered loudly.", grammar: "Such...that", highlight: "such an exciting game that" },
    { text: "The coffee was so hot that I burned my tongue.", grammar: "So...that", highlight: "so hot that" },
    { text: "He is such a kind person that everyone loves him.", grammar: "Such...that", highlight: "such a kind person that" },
    { text: "The test was so difficult that most students failed.", grammar: "So...that", highlight: "so difficult that" },
    { text: "There was so much noise that I couldn't concentrate.", grammar: "So much...that", highlight: "so much noise that" },
    { text: "So few tickets were available that we couldn't get any.", grammar: "So few...that", highlight: "So few tickets that" },
    { text: "It was such a long journey that we were exhausted.", grammar: "Such...that", highlight: "such a long journey that" },
    { text: "She sang so beautifully that the audience was moved to tears.", grammar: "So...that", highlight: "so beautifully that" },
    { text: "The food was such a disappointment that we left early.", grammar: "Such...that", highlight: "such a disappointment that" },
    { text: "He had so much work that he stayed late every day.", grammar: "So much...that", highlight: "so much work that" },
    { text: "It was such terrible weather that the event was cancelled.", grammar: "Such...that", highlight: "such terrible weather that" },
    { text: "The child was so tired that she fell asleep immediately.", grammar: "So...that", highlight: "so tired that" },
    { text: "There were so many options that I couldn't decide.", grammar: "So many...that", highlight: "so many options that" },
    { text: "He made such a good impression that he got the job.", grammar: "Such...that", highlight: "such a good impression that" },
    { text: "The music was so loud that my ears hurt.", grammar: "So...that", highlight: "so loud that" },
    { text: "She has such incredible patience that nothing bothers her.", grammar: "Such...that", highlight: "such incredible patience that" },
    { text: "The cake was so delicious that I had three slices.", grammar: "So...that", highlight: "so delicious that" },
    { text: "He drove so fast that he got a speeding ticket.", grammar: "So...that", highlight: "so fast that" },
    { text: "It was such a funny joke that everyone laughed.", grammar: "Such...that", highlight: "such a funny joke that" },
    // Reducing Adverb Clauses examples (25)
    { text: "Before leaving the house, she checked all the windows.", grammar: "Reducing Adverb Clauses", highlight: "Before leaving" },
    { text: "While studying for the exam, she listened to music.", grammar: "Reducing Adverb Clauses", highlight: "While studying" },
    { text: "After finishing dinner, they watched a movie.", grammar: "Reducing Adverb Clauses", highlight: "After finishing" },
    { text: "Since moving to the city, he has made many friends.", grammar: "Reducing Adverb Clauses", highlight: "Since moving" },
    { text: "Before starting the project, review all the instructions.", grammar: "Reducing Adverb Clauses", highlight: "Before starting" },
    { text: "While walking in the park, I saw a beautiful bird.", grammar: "Reducing Adverb Clauses", highlight: "While walking" },
    { text: "After completing the course, she received a certificate.", grammar: "Reducing Adverb Clauses", highlight: "After completing" },
    { text: "Before making a decision, consider all options.", grammar: "Reducing Adverb Clauses", highlight: "Before making" },
    { text: "While waiting for the bus, he read a book.", grammar: "Reducing Adverb Clauses", highlight: "While waiting" },
    { text: "After hearing the news, she called her mother.", grammar: "Reducing Adverb Clauses", highlight: "After hearing" },
    { text: "Since graduating from university, he has worked here.", grammar: "Reducing Adverb Clauses", highlight: "Since graduating" },
    { text: "Before entering the room, knock on the door.", grammar: "Reducing Adverb Clauses", highlight: "Before entering" },
    { text: "While cooking dinner, she talked on the phone.", grammar: "Reducing Adverb Clauses", highlight: "While cooking" },
    { text: "After reading the email, he replied immediately.", grammar: "Reducing Adverb Clauses", highlight: "After reading" },
    { text: "Before buying the car, test drive it first.", grammar: "Reducing Adverb Clauses", highlight: "Before buying" },
    { text: "While exercising, listen to motivating music.", grammar: "Reducing Adverb Clauses", highlight: "While exercising" },
    { text: "After watching the documentary, we discussed it.", grammar: "Reducing Adverb Clauses", highlight: "After watching" },
    { text: "Since joining the team, she has improved a lot.", grammar: "Reducing Adverb Clauses", highlight: "Since joining" },
    { text: "Before traveling abroad, get travel insurance.", grammar: "Reducing Adverb Clauses", highlight: "Before traveling" },
    { text: "While driving to work, he listens to podcasts.", grammar: "Reducing Adverb Clauses", highlight: "While driving" },
    { text: "After solving the problem, they celebrated.", grammar: "Reducing Adverb Clauses", highlight: "After solving" },
    { text: "Before submitting the form, verify all information.", grammar: "Reducing Adverb Clauses", highlight: "Before submitting" },
    { text: "While running in the morning, she plans her day.", grammar: "Reducing Adverb Clauses", highlight: "While running" },
    { text: "After receiving feedback, improve your work.", grammar: "Reducing Adverb Clauses", highlight: "After receiving" },
    { text: "Since learning English, he has gained confidence.", grammar: "Reducing Adverb Clauses", highlight: "Since learning" }
]

// 50 Questions for Unit 8
export const unit8Questions = [
    { question: "The movie was ___ interesting that I watched it twice.", options: ["so", "such", "very", "too"], correct: 0 },
    { question: "It was ___ a hot day that we stayed indoors.", options: ["so", "such", "very", "too"], correct: 1 },
    { question: "He ran ___ fast that he won the race.", options: ["such", "so", "such a", "very"], correct: 1 },
    { question: "She is ___ talented artist that galleries want her work.", options: ["so", "such", "such a", "very"], correct: 2 },
    { question: "There were ___ many people that we left early.", options: ["such", "so", "such a", "very"], correct: 1 },
    { question: "I have ___ much homework that I can't go out.", options: ["such", "so", "such a", "very"], correct: 1 },
    { question: "___ few students passed that the teacher was disappointed.", options: ["Such", "So", "Such a", "Very"], correct: 1 },
    { question: "It was ___ terrible experience that I never forgot it.", options: ["so", "such", "such a", "very"], correct: 2 },
    { question: "The food was ___ delicious that we ordered more.", options: ["such", "so", "such a", "very"], correct: 1 },
    { question: "He had ___ little money that he couldn't buy lunch.", options: ["such", "so", "such a", "very"], correct: 1 },
    { question: "After ___ the book, she wrote a review.", options: ["read", "reading", "to read", "reads"], correct: 1 },
    { question: "While ___ for the train, he checked his email.", options: ["wait", "waiting", "to wait", "waited"], correct: 1 },
    { question: "Before ___ the house, turn off all lights.", options: ["leave", "leaving", "to leave", "left"], correct: 1 },
    { question: "Since ___ to Japan, she has learned Japanese.", options: ["move", "moving", "to move", "moved"], correct: 1 },
    { question: "After ___ dinner, they watched TV.", options: ["have", "having", "to have", "had"], correct: 1 },
    { question: "The cake was ___ sweet that I couldn't eat it.", options: ["such", "so", "such a", "very"], correct: 1 },
    { question: "She made ___ good impression that she got hired.", options: ["so", "such", "such a", "very"], correct: 2 },
    { question: "Before ___ a decision, think carefully.", options: ["make", "making", "to make", "made"], correct: 1 },
    { question: "While ___ in the garden, I found an old coin.", options: ["dig", "digging", "to dig", "dug"], correct: 1 },
    { question: "He was ___ tired that he fell asleep immediately.", options: ["such", "so", "such a", "very"], correct: 1 },
    { question: "It was ___ confusing instructions that nobody understood.", options: ["so", "such", "such a", "very"], correct: 1 },
    { question: "There was ___ much traffic that we were late.", options: ["such", "so", "such a", "very"], correct: 1 },
    { question: "After ___ the email, she responded quickly.", options: ["receive", "receiving", "to receive", "received"], correct: 1 },
    { question: "The story was ___ boring that I stopped reading.", options: ["such", "so", "such a", "very"], correct: 1 },
    { question: "She speaks ___ quietly that no one can hear her.", options: ["such", "so", "such a", "very"], correct: 1 },
    { question: "___ completing the project, celebrate your success.", options: ["While", "After", "Since", "During"], correct: 1 },
    { question: "He is ___ honest person that everyone trusts him.", options: ["so", "such", "such an", "very"], correct: 2 },
    { question: "The test was ___ easy that everyone passed.", options: ["such", "so", "such an", "very"], correct: 1 },
    { question: "Before ___ abroad, get your passport.", options: ["travel", "traveling", "to travel", "traveled"], correct: 1 },
    { question: "While ___ to music, she cleaned the house.", options: ["listen", "listening", "to listen", "listened"], correct: 1 },
    { question: "They were ___ friendly neighbors that we miss them.", options: ["so", "such", "such a", "very"], correct: 1 },
    { question: "I had ___ little sleep that I couldn't focus.", options: ["such", "so", "such a", "very"], correct: 1 },
    { question: "Since ___ the new diet, he has lost weight.", options: ["start", "starting", "to start", "started"], correct: 1 },
    { question: "The weather was ___ nice that we went hiking.", options: ["such", "so", "such a", "very"], correct: 1 },
    { question: "She has ___ beautiful voice that everyone listens.", options: ["so", "such", "such a", "very"], correct: 2 },
    { question: "After ___ the instructions, begin the test.", options: ["read", "reading", "to read", "reads"], correct: 1 },
    { question: "There were ___ few options that I chose quickly.", options: ["such", "so", "such a", "very"], correct: 1 },
    { question: "He drove ___ carelessly that he had an accident.", options: ["such", "so", "such a", "very"], correct: 1 },
    { question: "While ___ the report, he found an error.", options: ["review", "reviewing", "to review", "reviewed"], correct: 1 },
    { question: "The book was ___ popular that it sold out.", options: ["such", "so", "such a", "very"], correct: 1 },
    { question: "Before ___ conclusions, gather all facts.", options: ["draw", "drawing", "to draw", "drew"], correct: 1 },
    { question: "It was ___ important meeting that everyone attended.", options: ["so", "such", "such an", "very"], correct: 2 },
    { question: "She has ___ many friends that her phone is always busy.", options: ["such", "so", "such a", "very"], correct: 1 },
    { question: "Since ___ his job, he has been happier.", options: ["change", "changing", "to change", "changed"], correct: 1 },
    { question: "The movie was ___ long that we took a break.", options: ["such", "so", "such a", "very"], correct: 1 },
    { question: "While ___ dinner, tell me about your day.", options: ["eat", "eating", "to eat", "ate"], correct: 1 },
    { question: "He made ___ many errors that he had to redo it.", options: ["such", "so", "such a", "very"], correct: 1 },
    { question: "After ___ the course, she got a certificate.", options: ["complete", "completing", "to complete", "completed"], correct: 1 },
    { question: "The pizza was ___ good that we ordered another.", options: ["such", "so", "such a", "very"], correct: 1 },
    { question: "Before ___ the contract, read it carefully.", options: ["sign", "signing", "to sign", "signed"], correct: 1 }
]
