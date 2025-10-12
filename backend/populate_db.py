import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI= os.getenv("MONGODB_URL")
DB_NAME = "test"
COLLECTION_NAME = "characters"

initial_characters = [
    {
        "CHARACTER": "Annabelle",
        "SOURCE": "The Conjuring Universe (Fictional) / Ed & Lorraine Warren Case Files (Real)",
        "IS_PART_OF_SERIES": "Yes (The Conjuring Universe: 3 Annabelle films, 4+ Conjuring films)",
        "GENDER_DESCRIPTION": "Female doll, vessel for a demonic entity",
        "IS_MALE": "No",
        "IS_FEMALE": "Yes",
        "IS_HUMAN": "No (Inanimate object/Doll)",
        "IS_FICTIONAL": "No (The physical doll exists; its haunting is debated)",
        "PORTRAYED_BY": "N/A (Prop)",
        "ORIGIN_CINEMA": "American Horror",
        "ORIGIN_LANGUAGE": "English",
        "FILM_SETTING_REGION": "Los Angeles, CA; Monroe, CT (Warren's Museum)",
        "DOLL_TYPE_REAL": "Raggedy Ann Doll (Cloth)",
        "DOLL_TYPE_FICTIONAL": "Porcelain Doll (Grotesque, antique)",
        "SUPERNATURAL_NATURE": "Demonic Conduit / Manifestation Point",
        "IS_CRIMINAL": "Yes (Responsible for property damage and bodily harm, allegedly)",
        "TARGET_ITEM": "Human Soul",
        "PRIMARY_MOTIVATION": "The demon's goal is to gain permission to enter and possess a human host.",
        "GOAL": "To cause fear, break down spiritual defenses, and escape its containment.",
        "HAS_SIGNATURE_PHRASE": "No (Communicates via notes like 'Help Us' in real-life claims)",
        "HAS_DISTINGUISHING_TRAIT": "Yes (Locked in a specially consecrated glass case with a cross)",
        "PRIMARY_COLORS": "White (Dress), Red (Hair/Ribbon), Brown (Wood case)", 
        "IS_A_HERO": "No",
        "IS_A_VILLAIN": "Yes (Primary antagonist)",
        "APPEARANCE_TRAITS": ["Fictional: Cracked porcelain and menacing expression.", "Real: Simple Raggedy Ann appearance (cloth, yarn hair)."],
        "BEHAVIOR_TRAITS": ["Teleportation", "Materialization (Creating hand-written notes)", "Manipulation (Pretends to be a harmless child's spirit)."],
        "RELATIONSHIPS": {"OWNERS_REAL": "Donna (Original); Ed and Lorraine Warren (Investigators)", "JAILERS": "Ed and Lorraine Warren"},
        "STATUS_AT_END_OF_FILM": "Relocked in the Warrens' artifact room, its containment is temporary but effective.",
        "HAS_SEQUEL_PLANNED": "Yes (Its presence continues to drive future *The Conjuring Universe* films)"
    },
    {
        "CHARACTER": "Pennywise",
        "SOURCE": "It (1986) by Stephen King",
        "IS_PART_OF_SERIES": "Yes (Stephen King's Multiverse / It Films & Miniseries)",
        "GENDER_DESCRIPTION": "Genderless/Female (True form is a giant spider laying eggs) / Male (as Pennywise the Clown)",
        "IS_MALE": "Yes (Primary form)",
        "IS_HUMAN": "No (Ancient, trans-dimensional alien entity)",
        "IS_FICTIONAL": "Yes",
        "PORTRAYED_BY": "Tim Curry (1990), Bill Skarsgård (2017/2019)",
        "ORIGIN_LITERATURE": "American Horror Novel",
        "FILM_SETTING_REGION": "Derry, Maine, USA (Crashes down in the area as an asteroid)",
        "SUPERNATURAL_NATURE": "Cosmic/Eldritch Horror (Entity from the Macroverse/Todash Darkness)",
        "PRIMARY_MOTIVATION": "To feed on the fear of children (their fear 'salts the meat') and perpetuate its feeding/sleep cycle.",
        "GOAL": "To consume the children of Derry every 27 years before retreating to hibernation.",
        "CYCLICAL_ACTIVITY": "Wakes and feeds roughly every 27 years.",
        "POWERS": ["Shapeshifting", "Illusion & Mind Control", "Regeneration/Immortality", "The Deadlights"],
        "WEAKNESSES": ["Belief/Confidence", "Ritual of Chüd", "Friendship/Love"],
        "SIGNATURE_PHRASE": "You'll float too!",
        "NEMESIS": "The Losers' Club (Bill Denbrough is the primary leader)",
        "CREATOR_NOVEL": "The Other (An even older cosmic entity)",
        "STATUS_AT_END_OF_FILM": "Killed by The Losers' Club (its heart is crushed/it shrinks and is beaten).",
        "IS_A_VILLAIN": "Yes (Pure Evil)"
    },
    {
        "CHARACTER": "Dracula",
        "SOURCE": "Dracula (1897) by Bram Stoker",
        "IS_PART_OF_SERIES": "No (Original novel is standalone, but character is most portrayed in media)",
        "GENDER_DESCRIPTION": "Male (Undead Vampire Nobleman)",
        "IS_MALE": "Yes",
        "IS_HUMAN": "No (Undead/Vampire)",
        "IS_FICTIONAL": "Yes (Loosely inspired by Vlad the Impaler)",
        "PORTRAYED_BY": "Bela Lugosi (1931), Christopher Lee, Gary Oldman",
        "ORIGIN_LITERATURE": "Gothic Horror Novel (Epistolary format)",
        "FILM_SETTING_REGION": "Transylvania, Carpathian Mountains (Castle Dracula) & London, England",
        "SUPERNATURAL_NATURE": "Vampire (Acquired powers through dealings with the devil/black arts at Scholomance)",
        "PRIMARY_MOTIVATION": "To secure new blood sources in England and establish a dynasty of vampires.",
        "GOAL": "To spread his influence, feed, and live forever. To conquer the modern world with ancient evil.",
        "TRANSFORMATION": "Can shapeshift into a wolf, a bat, mist, or elemental dust.",
        "POWERS": ["Superhuman Strength", "Hypnosis & Telepathy", "Defiance of Gravity", "Control over animals"],
        "WEAKNESSES": ["Sunlight", "Sacred Objects (Crucifixes, garlic, holy water)", "The True Death (Beheading and staking the heart)", "Cannot cross running water", "Has no reflection"],
        "SIGNATURE_PHRASE": "Listen to them. The children of the night. What sweet music they make.",
        "NEMESIS": "Professor Abraham Van Helsing (Chief Antagonist)",
        "PROTÉGÉS": "The Three Brides of Dracula (Vampiresses in his castle)",
        "STATUS_AT_END_OF_FILM": "Destroyed/Killed by Jonathan Harker and Quincey Morris.",
        "IS_A_VILLAIN": "Yes (Archetypal Vampire/Antagonist)"
    },
    {
        "CHARACTER": "Frankenstein",
        "SOURCE": "Frankenstein; or, The Modern Prometheus (1818) by Mary Shelley",
        "IS_PART_OF_SERIES": "No (Original novel is standalone, though pop culture made it a franchise)",
        "GENDER_DESCRIPTION": "Male (A newly created, sapient being)",
        "IS_MALE": "Yes",
        "IS_HUMAN": "No (Artificially created from collected human parts)",
        "IS_FICTIONAL": "Yes",
        "PORTRAYED_BY": "Boris Karloff (1931), Robert De Niro (1994), etc.",
        "ORIGIN_LITERATURE": "Gothic/Science Fiction Novel",
        "FILM_SETTING_REGION": "Ingolstadt, Bavaria (Creation); Geneva, Switzerland; The Arctic",
        "SUPERNATURAL_NATURE": "Alchemy/Galvanism/Applied Science",
        "PRIMARY_MOTIVATION": "Loneliness; seeking acceptance, love, and a female companion of its own kind after being abandoned by its creator.",
        "GOAL": "To compel his creator, Victor Frankenstein, to build a mate for him, or to destroy everything Victor loves.",
        "EDUCATIONAL_STATUS": "Highly intelligent and eloquent (Learns to read Milton, Plutarch, and Goethe)",
        "POWERS": ["Superhuman Strength & Endurance (8 feet tall)", "Exceptional Stamina", "High Intellect and Eloquence"],
        "WEAKNESSES": ["Emotional Rejection (His primary psychological weakness)", "Vulnerability to Normal Harm", "Isolation", "Fire (In many film adaptations)"],
        "SIGNATURE_PHRASE": "I ought to be thy Adam; but I am rather the fallen angel.",
        "CREATOR": "Victor Frankenstein (The real 'Frankenstein')",
        "VICTIMS": "William Frankenstein, Henry Clerval, Elizabeth Lavenza",
        "STATUS_AT_END_OF_FILM": "Mourns the death of Victor Frankenstein, vowing to burn himself on a pyre, and then departs into the Arctic.",
        "IS_A_VILLAIN": "Yes (Villain by consequence/abandonment; Sympathetic Antagonist)"
    }
]

def populate_mongodb():
    """Connects to MongoDB and inserts the full character list, clearing previous data."""
    try:
        client = MongoClient(MONGO_URI) #connect to db
        print(f"📡 Connecting to MongoDB...")

        db = client[DB_NAME] #access db n collection
        character_collection = db[COLLECTION_NAME]

        existing_count = character_collection.count_documents({})
        if existing_count > 0:
            print(f"⚠️  Found {existing_count} existing documents in {DB_NAME}.{COLLECTION_NAME}")
            user_input = input("Do you want to delete existing data and insert fresh? (yes/no): ").lower()
            if user_input == 'yes':
                character_collection.delete_many({})
                print("🗑️  Cleared existing data.")
            else:
                print("keep existing data n adding new characters!")       
   
        #remove any id field id present
        for char in initial_characters:
            if 'id' in char:
                char.pop('id')

        result = character_collection.insert_many(initial_characters)
        print(f"✅ Success! Inserted {len(result.inserted_ids)} characters into {DB_NAME}.{COLLECTION_NAME}.")

        total_count = character_collection.count_documents({})
        print(f"📊 Total characters in collection: {total_count}")
        
        client.close()
        print("db connection closed")

    except Exception as e:
        print(f" Connection/Insertion Failed: {e}")

if __name__ == "__main__":
    populate_mongodb()
