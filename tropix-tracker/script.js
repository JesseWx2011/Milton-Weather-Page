// --- Configuration & Data ---
let isMetric = false;

// Navigation Data
const siteLinks = [
    { name: "Home", url: "index.html" },
    { name: "Satellite Imagery", url: "satellite.html" }, 
    { name: "SST Anomalies", url: "sst-anomalies.html" },
    { name: "Storm Names", url: "storm-names.html" },
    { name: "Historical Data", url: "historical-data.html" },
    { name: "Archives", url: "#" }
];

// Historical Data Database
// Historical Data Database (1995-2026)
const historicalDB = {
    "1995": [
        { name: "Allison", start: "June 3", end: "June 6", wind: 75, press: 987, retired: false },
        { name: "Barry", start: "July 6", end: "July 10", wind: 70, press: 990, retired: false },
        { name: "Chantal", start: "July 12", end: "July 22", wind: 70, press: 991, retired: false },
        { name: "Dean", start: "July 28", end: "August 2", wind: 45, press: 999, retired: false },
        { name: "Erin", start: "July 31", end: "August 6", wind: 100, press: 973, retired: false },
        { name: "Felix", start: "August 8", end: "August 25", wind: 140, press: 929, retired: false },
        { name: "Gabrielle", start: "August 9", end: "August 12", wind: 70, press: 988, retired: false },
        { name: "Humberto", start: "August 22", end: "September 1", wind: 110, press: 960, retired: false },
        { name: "Iris", start: "August 22", end: "September 4", wind: 110, press: 965, retired: false },
        { name: "Jerry", start: "August 23", end: "August 28", wind: 40, press: 1002, retired: false },
        { name: "Karen", start: "August 26", end: "September 3", wind: 45, press: 1000, retired: false },
        { name: "Luis", start: "August 27", end: "September 11", wind: 140, press: 935, retired: true },
        { name: "Marilyn", start: "September 12", end: "September 22", wind: 115, press: 949, retired: true },
        { name: "Noel", start: "September 26", end: "October 7", wind: 75, press: 987, retired: false },
        { name: "Opal", start: "September 27", end: "October 6", wind: 150, press: 916, retired: true },
        { name: "Pablo", start: "October 4", end: "October 8", wind: 60, press: 994, retired: false },
        { name: "Roxanne", start: "October 7", end: "October 21", wind: 115, press: 956, retired: true },
        { name: "Sebastien", start: "October 20", end: "October 25", wind: 65, press: 1001, retired: false },
        { name: "Tanya", start: "October 26", end: "November 1", wind: 85, press: 972, retired: false }
    ],
    "1996": [
        { name: "Arthur", start: "June 17", end: "June 21", wind: 45, press: 1000, retired: false },
        { name: "Bertha", start: "July 5", end: "July 14", wind: 115, press: 960, retired: false },
        { name: "Cesar", start: "July 24", end: "July 29", wind: 85, press: 985, retired: true },
        { name: "Dolly", start: "August 14", end: "August 23", wind: 80, press: 989, retired: false },
        { name: "Edouard", start: "August 19", end: "September 3", wind: 145, press: 933, retired: false },
        { name: "Fran", start: "August 23", end: "September 8", wind: 120, press: 946, retired: true },
        { name: "Gustav", start: "August 26", end: "September 2", wind: 45, press: 1005, retired: false },
        { name: "Hortense", start: "September 3", end: "September 16", wind: 140, press: 935, retired: true },
        { name: "Isidore", start: "September 24", end: "October 1", wind: 115, press: 960, retired: false },
        { name: "Josephine", start: "October 4", end: "October 16", wind: 70, press: 981, retired: false },
        { name: "Kyle", start: "October 11", end: "October 12", wind: 50, press: 1001, retired: false },
        { name: "Lili", start: "October 14", end: "October 27", wind: 115, press: 960, retired: false },
        { name: "Marco", start: "November 16", end: "November 26", wind: 75, press: 983, retired: false }
    ],
    "1997": [
        { name: "Ana", start: "June 30", end: "July 4", wind: 45, press: 1000, retired: false },
        { name: "Bill", start: "July 11", end: "July 13", wind: 50, press: 1001, retired: false },
        { name: "Claudette", start: "July 13", end: "July 16", wind: 45, press: 1002, retired: false },
        { name: "Danny", start: "July 16", end: "July 27", wind: 80, press: 984, retired: false },
        { name: "Erika", start: "September 3", end: "September 15", wind: 125, press: 946, retired: false },
        { name: "Fabian", start: "October 4", end: "October 8", wind: 45, press: 1004, retired: false },
        { name: "Grace", start: "October 16", end: "October 17", wind: 45, press: 999, retired: false }
    ],
    "1998": [
        { name: "Alex", start: "July 27", end: "August 2", wind: 50, press: 1000, retired: false },
        { name: "Bonnie", start: "August 19", end: "August 30", wind: 115, press: 954, retired: false },
        { name: "Charley", start: "August 21", end: "August 24", wind: 70, press: 1000, retired: false },
        { name: "Danielle", start: "August 24", end: "September 3", wind: 105, press: 960, retired: false },
        { name: "Earl", start: "August 31", end: "September 3", wind: 100, press: 985, retired: false },
        { name: "Frances", start: "September 8", end: "September 13", wind: 65, press: 990, retired: false },
        { name: "Georges", start: "September 15", end: "October 1", wind: 155, press: 937, retired: true },
        { name: "Hermine", start: "September 17", end: "September 20", wind: 45, press: 999, retired: false },
        { name: "Ivan", start: "September 19", end: "September 27", wind: 90, press: 975, retired: false },
        { name: "Jeanne", start: "September 21", end: "October 1", wind: 105, press: 969, retired: false },
        { name: "Karl", start: "September 23", end: "September 28", wind: 105, press: 970, retired: false },
        { name: "Lisa", start: "October 5", end: "October 9", wind: 75, press: 985, retired: false },
        { name: "Mitch", start: "October 22", end: "November 5", wind: 180, press: 905, retired: true },
        { name: "Nicole", start: "November 24", end: "December 1", wind: 85, press: 979, retired: false }
    ],
    "1999": [
        { name: "Arlene", start: "June 11", end: "June 18", wind: 60, press: 989, retired: false },
        { name: "Bret", start: "August 18", end: "August 25", wind: 145, press: 944, retired: false },
        { name: "Cindy", start: "August 19", end: "August 31", wind: 140, press: 942, retired: false },
        { name: "Dennis", start: "August 24", end: "September 7", wind: 105, press: 962, retired: false },
        { name: "Emily", start: "August 24", end: "August 28", wind: 50, press: 1001, retired: false },
        { name: "Floyd", start: "September 7", end: "September 17", wind: 155, press: 921, retired: true },
        { name: "Gert", start: "September 11", end: "September 23", wind: 150, press: 930, retired: false },
        { name: "Harvey", start: "September 19", end: "September 22", wind: 60, press: 994, retired: false },
        { name: "Irene", start: "October 13", end: "October 19", wind: 110, press: 958, retired: false },
        { name: "Jose", start: "October 17", end: "October 25", wind: 100, press: 979, retired: false },
        { name: "Katrina", start: "October 28", end: "November 1", wind: 40, press: 999, retired: false },
        { name: "Lenny", start: "November 13", end: "November 23", wind: 155, press: 933, retired: true }
    ],
    "2000": [
        { name: "Alberto", start: "August 3", end: "August 23", wind: 125, press: 950, retired: false },
        { name: "Beryl", start: "August 13", end: "August 15", wind: 50, press: 1007, retired: false },
        { name: "Chris", start: "August 17", end: "August 19", wind: 40, press: 1008, retired: false },
        { name: "Debby", start: "August 19", end: "August 24", wind: 85, press: 991, retired: false },
        { name: "Ernesto", start: "September 1", end: "September 3", wind: 40, press: 1008, retired: false },
        { name: "Florence", start: "September 10", end: "September 17", wind: 80, press: 985, retired: false },
        { name: "Gordon", start: "September 14", end: "September 18", wind: 80, press: 981, retired: false },
        { name: "Helene", start: "September 15", end: "September 22", wind: 70, press: 986, retired: false },
        { name: "Isaac", start: "September 21", end: "October 1", wind: 140, press: 943, retired: false },
        { name: "Joyce", start: "September 25", end: "October 2", wind: 90, press: 975, retired: false },
        { name: "Keith", start: "September 28", end: "October 6", wind: 140, press: 939, retired: true },
        { name: "Leslie", start: "October 4", end: "October 7", wind: 45, press: 1006, retired: false },
        { name: "Michael", start: "October 15", end: "October 19", wind: 100, press: 965, retired: false },
        { name: "Nadine", start: "October 19", end: "October 22", wind: 60, press: 999, retired: false }
    ],
    "2001": [
        { name: "Allison", start: "June 5", end: "June 17", wind: 60, press: 1000, retired: true },
        { name: "Barry", start: "August 2", end: "August 7", wind: 70, press: 990, retired: false },
        { name: "Chantal", start: "August 14", end: "August 22", wind: 70, press: 997, retired: false },
        { name: "Dean", start: "August 22", end: "August 28", wind: 60, press: 994, retired: false },
        { name: "Erin", start: "September 1", end: "September 15", wind: 120, press: 968, retired: false },
        { name: "Felix", start: "September 7", end: "September 19", wind: 115, press: 962, retired: false },
        { name: "Gabrielle", start: "September 11", end: "September 19", wind: 80, press: 975, retired: false },
        { name: "Humberto", start: "September 21", end: "September 27", wind: 105, press: 970, retired: false },
        { name: "Iris", start: "October 4", end: "October 9", wind: 145, press: 948, retired: true },
        { name: "Jerry", start: "October 6", end: "October 8", wind: 50, press: 1004, retired: false },
        { name: "Karen", start: "October 12", end: "October 15", wind: 80, press: 982, retired: false },
        { name: "Lorenzo", start: "October 27", end: "October 31", wind: 40, press: 1007, retired: false },
        { name: "Michelle", start: "October 29", end: "November 5", wind: 140, press: 933, retired: true },
        { name: "Noel", start: "November 4", end: "November 6", wind: 75, press: 986, retired: false },
        { name: "Olga", start: "November 24", end: "December 6", wind: 90, press: 973, retired: false }
    ],
    "2002": [
        { name: "Arthur", start: "July 14", end: "July 16", wind: 60, press: 997, retired: false },
        { name: "Bertha", start: "August 4", end: "August 9", wind: 40, press: 1007, retired: false },
        { name: "Cristobal", start: "August 5", end: "August 8", wind: 50, press: 999, retired: false },
        { name: "Dolly", start: "August 29", end: "September 4", wind: 60, press: 997, retired: false },
        { name: "Edouard", start: "September 1", end: "September 6", wind: 65, press: 1002, retired: false },
        { name: "Fay", start: "September 5", end: "September 8", wind: 60, press: 998, retired: false },
        { name: "Gustav", start: "September 8", end: "September 12", wind: 100, press: 960, retired: false },
        { name: "Hanna", start: "September 12", end: "September 15", wind: 50, press: 1001, retired: false },
        { name: "Isidore", start: "September 14", end: "September 27", wind: 125, press: 934, retired: true },
        { name: "Josephine", start: "September 17", end: "September 19", wind: 40, press: 1006, retired: false },
        { name: "Kyle", start: "September 20", end: "October 12", wind: 85, press: 980, retired: false },
        { name: "Lili", start: "September 21", end: "October 4", wind: 145, press: 938, retired: true }
    ],
    "2003": [
        { name: "Ana", start: "April 20", end: "April 24", wind: 60, press: 994, retired: false },
        { name: "Bill", start: "June 29", end: "July 2", wind: 60, press: 997, retired: false },
        { name: "Claudette", start: "July 8", end: "July 17", wind: 90, press: 979, retired: false },
        { name: "Danny", start: "July 16", end: "July 21", wind: 75, press: 1000, retired: false },
        { name: "Erika", start: "August 14", end: "August 17", wind: 75, press: 988, retired: false },
        { name: "Fabian", start: "August 27", end: "September 8", wind: 145, press: 939, retired: true },
        { name: "Grace", start: "August 30", end: "September 2", wind: 40, press: 1007, retired: false },
        { name: "Henri", start: "September 3", end: "September 8", wind: 60, press: 997, retired: false },
        { name: "Isabel", start: "September 6", end: "September 20", wind: 165, press: 915, retired: true },
        { name: "Juan", start: "September 24", end: "September 29", wind: 105, press: 969, retired: true },
        { name: "Kate", start: "September 25", end: "October 7", wind: 125, press: 952, retired: false },
        { name: "Larry", start: "October 1", end: "October 6", wind: 65, press: 993, retired: false },
        { name: "Minday", start: "October 10", end: "October 14", wind: 45, press: 1002, retired: false },
        { name: "Nicholas", start: "October 13", end: "October 23", wind: 70, press: 990, retired: false },
        { name: "Odette", start: "December 4", end: "December 7", wind: 65, press: 993, retired: false },
        { name: "Peter", start: "December 7", end: "December 11", wind: 70, press: 990, retired: false }
    ],
    "2004": [
        { name: "Alex", start: "July 31", end: "August 6", wind: 120, press: 957, retired: false },
        { name: "Bonnie", start: "August 3", end: "August 14", wind: 65, press: 1001, retired: false },
        { name: "Charley", start: "August 9", end: "August 15", wind: 150, press: 941, retired: true },
        { name: "Danielle", start: "August 13", end: "August 21", wind: 110, press: 964, retired: false },
        { name: "Earl", start: "August 13", end: "August 16", wind: 50, press: 1009, retired: false },
        { name: "Frances", start: "August 24", end: "September 10", wind: 145, press: 935, retired: true },
        { name: "Gaston", start: "August 27", end: "September 1", wind: 75, press: 985, retired: false },
        { name: "Hermine", start: "August 27", end: "August 31", wind: 60, press: 1002, retired: false },
        { name: "Ivan", start: "September 2", end: "September 24", wind: 165, press: 910, retired: true },
        { name: "Jeanne", start: "September 13", end: "September 29", wind: 120, press: 950, retired: true },
        { name: "Karl", start: "September 16", end: "September 24", wind: 145, press: 938, retired: false },
        { name: "Lisa", start: "September 19", end: "October 3", wind: 75, press: 987, retired: false },
        { name: "Matthew", start: "October 8", end: "October 10", wind: 45, press: 997, retired: false },
        { name: "Nicole", start: "October 10", end: "October 11", wind: 50, press: 986, retired: false },
        { name: "Otto", start: "November 29", end: "December 3", wind: 50, press: 995, retired: false }
    ],
    "2005": [
        { name: "Arlene", start: "June 8", end: "June 13", wind: 70, press: 989, retired: false },
        { name: "Bret", start: "June 28", end: "June 30", wind: 40, press: 1002, retired: false },
        { name: "Cindy", start: "July 3", end: "July 7", wind: 75, press: 991, retired: false },
        { name: "Dennis", start: "July 4", end: "July 13", wind: 150, press: 930, retired: true },
        { name: "Emily", start: "July 11", end: "July 21", wind: 160, press: 929, retired: false },
        { name: "Franklin", start: "July 21", end: "July 29", wind: 70, press: 997, retired: false },
        { name: "Gert", start: "July 23", end: "July 25", wind: 45, press: 1005, retired: false },
        { name: "Harvey", start: "August 2", end: "August 8", wind: 65, press: 994, retired: false },
        { name: "Irene", start: "August 4", end: "August 18", wind: 105, press: 970, retired: false },
        { name: "TD Ten", start: "August 13", end: "August 14", wind: 35, press: 1008, retired: false },
        { name: "Jose", start: "August 22", end: "August 23", wind: 60, press: 998, retired: false },
        { name: "Katrina", start: "August 23", end: "August 30", wind: 175, press: 902, retired: true },
        { name: "Lee", start: "August 28", end: "September 2", wind: 40, press: 1006, retired: false },
        { name: "Maria", start: "September 1", end: "September 10", wind: 115, press: 962, retired: false },
        { name: "Nate", start: "September 5", end: "September 10", wind: 90, press: 979, retired: false },
        { name: "Ophelia", start: "September 6", end: "September 17", wind: 85, press: 976, retired: false },
        { name: "Philippe", start: "September 17", end: "September 24", wind: 80, press: 985, retired: false },
        { name: "Rita", start: "September 18", end: "September 26", wind: 180, press: 895, retired: true },
        { name: "TD Nineteen", start: "September 30", end: "October 2", wind: 35, press: 1006, retired: false },
        { name: "Stan", start: "October 1", end: "October 5", wind: 80, press: 977, retired: true },
        { name: "Unnamed (Subtropical)", start: "October 4", end: "October 5", wind: 50, press: 997, retired: false, type: 'subtropical' },
        { name: "Tammy", start: "October 5", end: "October 6", wind: 50, press: 1001, retired: false },
        { name: "SubTD Twenty-Two", start: "October 8", end: "October 9", wind: 35, press: 1008, retired: false },
        { name: "Vince", start: "October 8", end: "October 11", wind: 75, press: 988, retired: false },
        { name: "Wilma", start: "October 15", end: "October 26", wind: 185, press: 882, retired: true },
        { name: "Alpha", start: "October 22", end: "October 24", wind: 50, press: 998, retired: false },
        { name: "Beta", start: "October 26", end: "October 31", wind: 115, press: 962, retired: false },
        { name: "TD Twenty-Seven", start: "November 13", end: "November 16", wind: 35, press: 1006, retired: false },
        { name: "Gamma", start: "November 14", end: "November 21", wind: 50, press: 1002, retired: false },
        { name: "Delta", start: "November 22", end: "November 28", wind: 70, press: 980, retired: false },
        { name: "Epsilon", start: "November 29", end: "December 8", wind: 85, press: 981, retired: false },
        { name: "Zeta", start: "December 30", end: "January 6 (06)", wind: 65, press: 994, retired: false }
    ],
    "2006": [
        { name: "Alberto", start: "June 10", end: "June 14", wind: 70, press: 995, retired: false },
        { name: "Unnamed", start: "July 17", end: "July 18", wind: 50, press: 998, retired: false },
        { name: "Beryl", start: "July 18", end: "July 21", wind: 60, press: 1000, retired: false },
        { name: "Chris", start: "August 1", end: "August 4", wind: 65, press: 1001, retired: false },
        { name: "Debby", start: "August 21", end: "August 26", wind: 50, press: 999, retired: false },
        { name: "Ernesto", start: "August 24", end: "September 1", wind: 75, press: 985, retired: false },
        { name: "Florence", start: "September 3", end: "September 12", wind: 90, press: 974, retired: false },
        { name: "Gordon", start: "September 10", end: "September 20", wind: 120, press: 955, retired: false },
        { name: "Helene", start: "September 12", end: "September 24", wind: 120, press: 955, retired: false },
        { name: "Isaac", start: "September 27", end: "October 2", wind: 85, press: 985, retired: false }
    ],
    "2007": [
        { name: "Andrea", start: "May 9", end: "May 11", wind: 45, press: 1001, retired: false },
        { name: "Barry", start: "June 1", end: "June 2", wind: 60, press: 997, retired: false },
        { name: "Chantal", start: "July 31", end: "August 1", wind: 50, press: 997, retired: false },
        { name: "Dean", start: "August 13", end: "August 23", wind: 175, press: 905, retired: true },
        { name: "Erin", start: "August 15", end: "August 17", wind: 40, press: 1003, retired: false },
        { name: "Felix", start: "August 31", end: "September 5", wind: 175, press: 929, retired: true },
        { name: "Gabrielle", start: "September 8", end: "September 11", wind: 60, press: 1004, retired: false },
        { name: "Humberto", start: "September 12", end: "September 14", wind: 90, press: 985, retired: false },
        { name: "Ingrid", start: "September 12", end: "September 17", wind: 45, press: 1002, retired: false },
        { name: "Jerry", start: "September 23", end: "September 25", wind: 40, press: 1003, retired: false },
        { name: "Karen", start: "September 25", end: "September 29", wind: 70, press: 988, retired: false },
        { name: "Lorenzo", start: "September 25", end: "September 28", wind: 80, press: 990, retired: false },
        { name: "Melissa", start: "September 28", end: "September 30", wind: 40, press: 1005, retired: false },
        { name: "Noel", start: "October 28", end: "November 2", wind: 80, press: 980, retired: true },
        { name: "Olga", start: "December 11", end: "December 13", wind: 60, press: 1003, retired: false }
    ],
    "2008": [
        { name: "Arthur", start: "May 31", end: "June 1", wind: 45, press: 1004, retired: false },
        { name: "Bertha", start: "July 3", end: "July 20", wind: 125, press: 952, retired: false },
        { name: "Cristobal", start: "July 19", end: "July 23", wind: 65, press: 998, retired: false },
        { name: "Dolly", start: "July 20", end: "July 25", wind: 100, press: 963, retired: false },
        { name: "Edouard", start: "August 3", end: "August 6", wind: 65, press: 996, retired: false },
        { name: "Fay", start: "August 15", end: "August 27", wind: 70, press: 986, retired: false },
        { name: "Gustav", start: "August 25", end: "September 4", wind: 155, press: 941, retired: true },
        { name: "Hanna", start: "August 28", end: "September 7", wind: 85, press: 977, retired: false },
        { name: "Ike", start: "September 1", end: "September 14", wind: 145, press: 935, retired: true },
        { name: "Josephine", start: "September 2", end: "September 6", wind: 65, press: 994, retired: false },
        { name: "Kyle", start: "September 25", end: "September 29", wind: 85, press: 984, retired: false },
        { name: "Laura", start: "September 29", end: "October 1", wind: 60, press: 994, retired: false },
        { name: "Marco", start: "October 6", end: "October 7", wind: 65, press: 998, retired: false },
        { name: "Omar", start: "October 13", end: "October 18", wind: 130, press: 958, retired: false },
        { name: "Paloma", start: "November 5", end: "November 9", wind: 145, press: 944, retired: true }
    ],
    "2009": [
        { name: "Ana", start: "August 11", end: "August 16", wind: 40, press: 1003, retired: false },
        { name: "Bill", start: "August 15", end: "August 24", wind: 130, press: 943, retired: false },
        { name: "Claudette", start: "August 16", end: "August 17", wind: 60, press: 1005, retired: false },
        { name: "Danny", start: "August 26", end: "August 29", wind: 60, press: 1006, retired: false },
        { name: "Erika", start: "September 1", end: "September 3", wind: 50, press: 1004, retired: false },
        { name: "Fred", start: "September 7", end: "September 12", wind: 120, press: 958, retired: false },
        { name: "Grace", start: "October 4", end: "October 6", wind: 65, press: 986, retired: false },
        { name: "Henri", start: "October 6", end: "October 8", wind: 50, press: 1003, retired: false },
        { name: "Ida", start: "November 4", end: "November 10", wind: 105, press: 975, retired: false }
    ],
    "2010": [
        { name: "Alex", start: "June 25", end: "July 2", wind: 110, press: 946, retired: false },
        { name: "Bonnie", start: "July 22", end: "July 24", wind: 40, press: 1005, retired: false },
        { name: "Colin", start: "August 2", end: "August 8", wind: 60, press: 1005, retired: false },
        { name: "Danielle", start: "August 21", end: "August 31", wind: 130, press: 942, retired: false },
        { name: "Earl", start: "August 25", end: "September 4", wind: 145, press: 927, retired: false },
        { name: "Fiona", start: "August 30", end: "September 3", wind: 65, press: 998, retired: false },
        { name: "Gaston", start: "September 1", end: "September 2", wind: 40, press: 1005, retired: false },
        { name: "Hermine", start: "September 6", end: "September 8", wind: 70, press: 989, retired: false },
        { name: "Igor", start: "September 8", end: "September 21", wind: 155, press: 924, retired: true },
        { name: "Julia", start: "September 12", end: "September 20", wind: 140, press: 948, retired: false },
        { name: "Karl", start: "September 14", end: "September 18", wind: 125, press: 956, retired: false },
        { name: "Lisa", start: "September 20", end: "September 26", wind: 85, press: 982, retired: false },
        { name: "Matthew", start: "September 23", end: "September 26", wind: 60, press: 998, retired: false },
        { name: "Nicole", start: "September 28", end: "September 30", wind: 45, press: 995, retired: false },
        { name: "Otto", start: "October 6", end: "October 10", wind: 85, press: 976, retired: false },
        { name: "Paula", start: "October 11", end: "October 15", wind: 105, press: 981, retired: false },
        { name: "Richard", start: "October 20", end: "October 26", wind: 100, press: 977, retired: false },
        { name: "Shary", start: "October 28", end: "October 30", wind: 75, press: 989, retired: false },
        { name: "Tomas", start: "October 29", end: "November 7", wind: 100, press: 982, retired: true }
    ],
    "2011": [
        { name: "Arlene", start: "June 28", end: "July 1", wind: 65, press: 993, retired: false },
        { name: "Bret", start: "July 17", end: "July 22", wind: 70, press: 995, retired: false },
        { name: "Cindy", start: "July 20", end: "July 23", wind: 70, press: 994, retired: false },
        { name: "Don", start: "July 27", end: "July 30", wind: 50, press: 1002, retired: false },
        { name: "Emily", start: "August 2", end: "August 7", wind: 50, press: 1003, retired: false },
        { name: "Franklin", start: "August 12", end: "August 13", wind: 45, press: 1004, retired: false },
        { name: "Gert", start: "August 14", end: "August 16", wind: 65, press: 1000, retired: false },
        { name: "Harvey", start: "August 19", end: "August 22", wind: 65, press: 994, retired: false },
        { name: "Irene", start: "August 21", end: "August 28", wind: 120, press: 942, retired: true },
        { name: "Jose", start: "August 28", end: "August 29", wind: 45, press: 1006, retired: false },
        { name: "Katia", start: "August 29", end: "September 7", wind: 140, press: 942, retired: false },
        { name: "Lee", start: "September 2", end: "September 5", wind: 60, press: 986, retired: false },
        { name: "Maria", start: "September 6", end: "September 16", wind: 80, press: 979, retired: false },
        { name: "Nate", start: "September 7", end: "September 11", wind: 75, press: 994, retired: false },
        { name: "Ophelia", start: "September 20", end: "October 3", wind: 140, press: 940, retired: false },
        { name: "Philippe", start: "September 24", end: "October 8", wind: 90, press: 976, retired: false },
        { name: "Rina", start: "October 23", end: "October 28", wind: 110, press: 966, retired: false },
        { name: "Sean", start: "November 8", end: "November 11", wind: 65, press: 982, retired: false }
    ],
    "2012": [
        { name: "Alberto", start: "May 19", end: "May 22", wind: 60, press: 995, retired: false },
        { name: "Beryl", start: "May 26", end: "May 30", wind: 70, press: 992, retired: false },
        { name: "Chris", start: "June 19", end: "June 22", wind: 75, press: 987, retired: false },
        { name: "Debby", start: "June 23", end: "June 27", wind: 60, press: 990, retired: false },
        { name: "Ernesto", start: "August 1", end: "August 10", wind: 100, press: 973, retired: false },
        { name: "Florence", start: "August 3", end: "August 6", wind: 60, press: 1002, retired: false },
        { name: "Gordon", start: "August 15", end: "August 20", wind: 110, press: 964, retired: false },
        { name: "Helene", start: "August 17", end: "August 19", wind: 45, press: 1004, retired: false },
        { name: "Isaac", start: "August 21", end: "September 1", wind: 80, press: 965, retired: false },
        { name: "Joyce", start: "August 22", end: "August 24", wind: 40, press: 1006, retired: false },
        { name: "Kirk", start: "August 28", end: "September 4", wind: 105, press: 970, retired: false },
        { name: "Leslie", start: "August 30", end: "September 11", wind: 100, press: 968, retired: false },
        { name: "Michael", start: "September 3", end: "September 11", wind: 115, press: 964, retired: false },
        { name: "Nadine", start: "September 11", end: "October 4", wind: 90, press: 978, retired: false },
        { name: "Oscar", start: "October 3", end: "October 5", wind: 50, press: 994, retired: false },
        { name: "Patty", start: "October 11", end: "October 13", wind: 45, press: 1005, retired: false },
        { name: "Rafael", start: "October 12", end: "October 17", wind: 90, press: 969, retired: false },
        { name: "Sandy", start: "October 22", end: "October 29", wind: 115, press: 940, retired: true },
        { name: "Tony", start: "October 22", end: "October 25", wind: 50, press: 1000, retired: false }
    ],
    "2013": [
        { name: "Andrea", start: "June 5", end: "June 7", wind: 65, press: 992, retired: false },
        { name: "Barry", start: "June 17", end: "June 20", wind: 45, press: 1003, retired: false },
        { name: "Chantal", start: "July 7", end: "July 10", wind: 65, press: 1003, retired: false },
        { name: "Dorian", start: "July 23", end: "August 3", wind: 60, press: 1002, retired: false },
        { name: "Erin", start: "August 15", end: "August 18", wind: 45, press: 1006, retired: false },
        { name: "Fernand", start: "August 25", end: "August 26", wind: 60, press: 1001, retired: false },
        { name: "Gabrielle", start: "September 4", end: "September 13", wind: 65, press: 1003, retired: false },
        { name: "Humberto", start: "September 8", end: "September 19", wind: 90, press: 979, retired: false },
        { name: "Ingrid", start: "September 12", end: "September 17", wind: 85, press: 983, retired: true },
        { name: "Jerry", start: "September 29", end: "October 3", wind: 50, press: 1005, retired: false },
        { name: "Karen", start: "October 3", end: "October 6", wind: 65, press: 998, retired: false },
        { name: "Lorenzo", start: "October 21", end: "October 24", wind: 50, press: 1000, retired: false },
        { name: "Melissa", start: "November 18", end: "November 22", wind: 65, press: 980, retired: false }
    ],
    "2014": [
        { name: "Arthur", start: "July 1", end: "July 5", wind: 100, press: 973, retired: false },
        { name: "Bertha", start: "August 1", end: "August 6", wind: 80, press: 994, retired: false },
        { name: "Cristobal", start: "August 23", end: "August 29", wind: 85, press: 970, retired: false },
        { name: "Dolly", start: "September 1", end: "September 3", wind: 50, press: 1000, retired: false },
        { name: "Edouard", start: "September 11", end: "September 19", wind: 115, press: 955, retired: false },
        { name: "Fay", start: "October 10", end: "October 13", wind: 80, press: 983, retired: false },
        { name: "Gonzalo", start: "October 12", end: "October 19", wind: 145, press: 940, retired: false },
        { name: "Hanna", start: "October 22", end: "October 28", wind: 40, press: 1000, retired: false }
    ],
    "2015": [
        { name: "Ana", start: "May 8", end: "May 11", wind: 60, press: 998, retired: false },
        { name: "Bill", start: "June 16", end: "June 18", wind: 60, press: 997, retired: false },
        { name: "Claudette", start: "July 13", end: "July 14", wind: 50, press: 1003, retired: false },
        { name: "Danny", start: "August 18", end: "August 24", wind: 125, press: 960, retired: false },
        { name: "Erika", start: "August 25", end: "August 29", wind: 50, press: 1001, retired: true },
        { name: "Fred", start: "August 30", end: "September 6", wind: 85, press: 986, retired: false },
        { name: "Grace", start: "September 5", end: "September 9", wind: 60, press: 1000, retired: false },
        { name: "Henri", start: "September 8", end: "September 11", wind: 50, press: 1003, retired: false },
        { name: "Ida", start: "September 18", end: "September 27", wind: 50, press: 1001, retired: false },
        { name: "Joaquin", start: "September 28", end: "October 7", wind: 155, press: 931, retired: true },
        { name: "Kate", start: "November 9", end: "November 11", wind: 75, press: 980, retired: false }
    ],
    "2016": [
        { name: "Alex", start: "January 13", end: "January 15", wind: 85, press: 981, retired: false },
        { name: "Bonnie", start: "May 27", end: "June 4", wind: 45, press: 1006, retired: false },
        { name: "Colin", start: "June 5", end: "June 7", wind: 50, press: 1001, retired: false },
        { name: "Danielle", start: "June 19", end: "June 21", wind: 45, press: 1007, retired: false },
        { name: "Earl", start: "August 2", end: "August 6", wind: 75, press: 979, retired: false },
        { name: "Fiona", start: "August 17", end: "August 23", wind: 50, press: 1004, retired: false },
        { name: "Gaston", start: "August 22", end: "September 3", wind: 120, press: 955, retired: false },
        { name: "Hermine", start: "August 28", end: "September 3", wind: 80, press: 981, retired: false },
        { name: "Ian", start: "September 12", end: "September 16", wind: 60, press: 994, retired: false },
        { name: "Julia", start: "September 13", end: "September 18", wind: 40, press: 1007, retired: false },
        { name: "Karl", start: "September 14", end: "September 25", wind: 70, press: 988, retired: false },
        { name: "Lisa", start: "September 19", end: "September 25", wind: 50, press: 999, retired: false },
        { name: "Matthew", start: "September 28", end: "October 9", wind: 165, press: 934, retired: true },
        { name: "Nicole", start: "October 4", end: "October 18", wind: 115, press: 950, retired: false },
        { name: "Otto", start: "November 20", end: "November 26", wind: 115, press: 975, retired: true }
    ],
    "2017": [
        { name: "Arlene", start: "April 19", end: "April 21", wind: 50, press: 990, retired: false },
        { name: "Bret", start: "June 19", end: "June 20", wind: 45, press: 1007, retired: false },
        { name: "Cindy", start: "June 20", end: "June 23", wind: 60, press: 991, retired: false },
        { name: "Don", start: "July 17", end: "July 18", wind: 50, press: 1005, retired: false },
        { name: "Emily", start: "July 31", end: "August 1", wind: 45, press: 1005, retired: false },
        { name: "Franklin", start: "August 7", end: "August 10", wind: 85, press: 981, retired: false },
        { name: "Gert", start: "August 13", end: "August 21", wind: 105, press: 962, retired: false },
        { name: "Harvey", start: "August 17", end: "September 1", wind: 130, press: 937, retired: true },
        { name: "Irma", start: "August 30", end: "September 12", wind: 180, press: 914, retired: true },
        { name: "Jose", start: "September 5", end: "September 22", wind: 155, press: 938, retired: false },
        { name: "Katia", start: "September 5", end: "September 9", wind: 105, press: 972, retired: false },
        { name: "Lee", start: "September 15", end: "September 30", wind: 115, press: 962, retired: false },
        { name: "Maria", start: "September 16", end: "September 30", wind: 175, press: 908, retired: true },
        { name: "Nate", start: "October 4", end: "October 9", wind: 90, press: 981, retired: true },
        { name: "Ophelia", start: "October 9", end: "October 16", wind: 115, press: 959, retired: false },
        { name: "Philippe", start: "October 28", end: "October 29", wind: 40, press: 1000, retired: false },
        { name: "Rina", start: "November 5", end: "November 9", wind: 60, press: 991, retired: false }
    ],
    "2018": [
        { name: "Alberto", start: "May 25", end: "May 31", wind: 65, press: 990, retired: false },
        { name: "Beryl", start: "July 4", end: "July 15", wind: 80, press: 991, retired: false },
        { name: "Chris", start: "July 8", end: "July 12", wind: 105, press: 969, retired: false },
        { name: "Debby", start: "August 7", end: "August 9", wind: 50, press: 998, retired: false },
        { name: "Ernesto", start: "August 15", end: "August 18", wind: 45, press: 1003, retired: false },
        { name: "Florence", start: "August 31", end: "September 17", wind: 150, press: 937, retired: true },
        { name: "Gordon", start: "September 3", end: "September 6", wind: 70, press: 996, retired: false },
        { name: "Helene", start: "September 7", end: "September 16", wind: 110, press: 967, retired: false },
        { name: "Isaac", start: "September 7", end: "September 15", wind: 75, press: 995, retired: false },
        { name: "Joyce", start: "September 12", end: "September 19", wind: 50, press: 995, retired: false },
        { name: "Kirk", start: "September 22", end: "September 29", wind: 65, press: 998, retired: false },
        { name: "Leslie", start: "September 23", end: "October 13", wind: 90, press: 968, retired: false },
        { name: "Michael", start: "October 7", end: "October 11", wind: 160, press: 919, retired: true },
        { name: "Nadine", start: "October 9", end: "October 12", wind: 65, press: 995, retired: false },
        { name: "Oscar", start: "October 26", end: "October 31", wind: 110, press: 966, retired: false }
    ],
    "2019": [
        { name: "Andrea", start: "May 20", end: "May 21", wind: 40, press: 1006, retired: false },
        { name: "Barry", start: "July 11", end: "July 15", wind: 75, press: 993, retired: false },
        { name: "Chantal", start: "August 20", end: "August 24", wind: 40, press: 1007, retired: false },
        { name: "Dorian", start: "August 24", end: "September 7", wind: 185, press: 910, retired: true },
        { name: "Erin", start: "August 26", end: "August 29", wind: 40, press: 1002, retired: false },
        { name: "Fernand", start: "September 3", end: "September 5", wind: 50, press: 1000, retired: false },
        { name: "Gabrielle", start: "September 3", end: "September 10", wind: 65, press: 995, retired: false },
        { name: "Humberto", start: "September 13", end: "September 19", wind: 125, press: 950, retired: false },
        { name: "Jerry", start: "September 17", end: "September 25", wind: 105, press: 976, retired: false },
        { name: "Karen", start: "September 22", end: "September 27", wind: 45, press: 1003, retired: false },
        { name: "Lorenzo", start: "September 23", end: "October 2", wind: 160, press: 925, retired: false },
        { name: "Melissa", start: "October 11", end: "October 14", wind: 65, press: 994, retired: false },
        { name: "Nestor", start: "October 18", end: "October 19", wind: 60, press: 996, retired: false },
        { name: "Olga", start: "October 25", end: "October 25", wind: 40, press: 998, retired: false },
        { name: "Pablo", start: "October 25", end: "October 28", wind: 80, press: 977, retired: false },
        { name: "Rebekah", start: "October 30", end: "November 1", wind: 50, press: 982, retired: false },
        { name: "Sebastien", start: "November 19", end: "November 25", wind: 70, press: 991, retired: false }
    ],
    "2020": [
        { name: "Arthur", start: "May 16", end: "May 19", wind: 60, press: 990, retired: false },
        { name: "Bertha", start: "May 27", end: "May 28", wind: 50, press: 1005, retired: false },
        { name: "Cristobal", start: "June 1", end: "June 9", wind: 60, press: 992, retired: false },
        { name: "Dolly", start: "June 22", end: "June 24", wind: 45, press: 1000, retired: false },
        { name: "Edouard", start: "July 4", end: "July 6", wind: 45, press: 1005, retired: false },
        { name: "Fay", start: "July 9", end: "July 11", wind: 60, press: 998, retired: false },
        { name: "Gonzalo", start: "July 21", end: "July 25", wind: 65, press: 997, retired: false },
        { name: "Hanna", start: "July 23", end: "July 27", wind: 90, press: 973, retired: false },
        { name: "Isaias", start: "July 30", end: "August 5", wind: 90, press: 987, retired: false },
        { name: "Josephine", start: "August 11", end: "August 16", wind: 45, press: 1004, retired: false },
        { name: "Kyle", start: "August 14", end: "August 16", wind: 50, press: 1000, retired: false },
        { name: "Laura", start: "August 20", end: "August 29", wind: 150, press: 937, retired: true },
        { name: "Marco", start: "August 20", end: "August 25", wind: 75, press: 991, retired: false },
        { name: "Nana", start: "September 1", end: "September 4", wind: 75, press: 994, retired: false },
        { name: "Omar", start: "September 1", end: "September 5", wind: 40, press: 1003, retired: false },
        { name: "Paulette", start: "September 7", end: "September 23", wind: 105, press: 965, retired: false },
        { name: "Rene", start: "September 7", end: "September 14", wind: 45, press: 1000, retired: false },
        { name: "Sally", start: "September 11", end: "September 18", wind: 105, press: 965, retired: false },
        { name: "Teddy", start: "September 12", end: "September 23", wind: 140, press: 945, retired: false },
        { name: "Vicky", start: "September 14", end: "September 17", wind: 50, press: 1000, retired: false },
        { name: "Wilfred", start: "September 18", end: "September 21", wind: 40, press: 1006, retired: false },
        { name: "Alpha", start: "September 18", end: "September 19", wind: 50, press: 996, retired: false },
        { name: "Beta", start: "September 17", end: "September 23", wind: 60, press: 993, retired: false },
        { name: "Gamma", start: "October 2", end: "October 6", wind: 70, press: 978, retired: false },
        { name: "Delta", start: "October 4", end: "October 10", wind: 145, press: 935, retired: false },
        { name: "Epsilon", start: "October 19", end: "October 26", wind: 115, press: 952, retired: false },
        { name: "Zeta", start: "October 24", end: "October 29", wind: 115, press: 970, retired: false },
        { name: "Eta", start: "October 31", end: "November 13", wind: 150, press: 923, retired: true },
        { name: "Theta", start: "November 10", end: "November 15", wind: 70, press: 987, retired: false },
        { name: "Iota", start: "November 13", end: "November 18", wind: 155, press: 917, retired: true }
    ],
    "2021": [
        { name: "Ana", start: "May 22", end: "May 24", wind: 45, press: 1004, retired: false },
        { name: "Bill", start: "June 14", end: "June 16", wind: 65, press: 992, retired: false },
        { name: "Claudette", start: "June 19", end: "June 22", wind: 45, press: 1003, retired: false },
        { name: "Danny", start: "June 28", end: "June 29", wind: 45, press: 1010, retired: false },
        { name: "Elsa", start: "July 1", end: "July 9", wind: 85, press: 991, retired: false },
        { name: "Fred", start: "August 11", end: "August 17", wind: 65, press: 991, retired: false },
        { name: "Grace", start: "August 13", end: "August 21", wind: 125, press: 967, retired: false },
        { name: "Henri", start: "August 16", end: "August 23", wind: 75, press: 986, retired: false },
        { name: "Ida", start: "August 26", end: "September 1", wind: 150, press: 929, retired: true },
        { name: "Julian", start: "August 29", end: "August 30", wind: 60, press: 993, retired: false },
        { name: "Kate", start: "August 30", end: "September 1", wind: 45, press: 1004, retired: false },
        { name: "Larry", start: "August 31", end: "September 11", wind: 125, press: 953, retired: false },
        { name: "Mindy", start: "September 8", end: "September 9", wind: 45, press: 1000, retired: false },
        { name: "Nicholas", start: "September 12", end: "September 14", wind: 75, press: 988, retired: false },
        { name: "Odette", start: "September 17", end: "September 18", wind: 45, press: 1005, retired: false },
        { name: "Peter", start: "September 19", end: "September 22", wind: 50, press: 1005, retired: false },
        { name: "Rose", start: "September 19", end: "September 22", wind: 50, press: 1004, retired: false },
        { name: "Sam", start: "September 22", end: "October 5", wind: 155, press: 927, retired: false },
        { name: "Teresa", start: "September 24", end: "September 25", wind: 45, press: 1008, retired: false },
        { name: "Victor", start: "September 29", end: "October 4", wind: 65, press: 997, retired: false },
        { name: "Wanda", start: "October 30", end: "November 7", wind: 50, press: 983, retired: false }
    ],
    "2022": [
        { name: "Alex", start: "June 5", end: "June 6", wind: 70, press: 984, retired: false },
        { name: "Bonnie", start: "July 1", end: "July 2", wind: 50, press: 997, retired: false },
        { name: "Colin", start: "July 2", end: "July 3", wind: 40, press: 1011, retired: false },
        { name: "Danielle", start: "September 1", end: "September 8", wind: 90, press: 972, retired: false },
        { name: "Earl", start: "September 3", end: "September 10", wind: 105, press: 954, retired: false },
        { name: "Fiona", start: "September 14", end: "September 24", wind: 130, press: 932, retired: true },
        { name: "Gaston", start: "September 20", end: "September 26", wind: 65, press: 995, retired: false },
        { name: "Ian", start: "September 23", end: "September 30", wind: 160, press: 937, retired: true },
        { name: "Julia", start: "October 7", end: "October 10", wind: 85, press: 982, retired: false },
        { name: "Karl", start: "October 11", end: "October 15", wind: 60, press: 997, retired: false },
        { name: "Lisa", start: "October 31", end: "November 3", wind: 85, press: 985, retired: false },
        { name: "Martin", start: "November 1", end: "November 3", wind: 85, press: 960, retired: false },
        { name: "Nicole", start: "November 7", end: "November 11", wind: 75, press: 980, retired: false }
    ],
    "2023": [
        { name: "Unnamed", start: "January 16", end: "January 17", wind: 70, press: 981, retired: false, type: 'SS' },
        { name: "Arlene", start: "June 1", end: "June 3", wind: 40, press: 998, retired: false },
        { name: "Bret", start: "June 19", end: "June 24", wind: 70, press: 996, retired: false },
        { name: "Cindy", start: "June 22", end: "June 26", wind: 60, press: 1004, retired: false },
        { name: "Don", start: "July 14", end: "July 24", wind: 75, press: 986, retired: false },
        { name: "Gert", start: "August 19", end: "September 4", wind: 60, press: 997, retired: false },
        { name: "Harold", start: "August 21", end: "August 23", wind: 50, press: 996, retired: false },
        { name: "Franklin", start: "August 21", end: "September 1", wind: 150, press: 926, retired: false },
        { name: "Idalia", start: "August 26", end: "August 31", wind: 130, press: 940, retired: false },
        { name: "Jose", start: "August 29", end: "September 2", wind: 60, press: 996, retired: false },
        { name: "Katia", start: "September 1", end: "September 4", wind: 60, press: 998, retired: false },
        { name: "Lee", start: "September 5", end: "September 16", wind: 165, press: 926, retired: false },
        { name: "Margot", start: "September 7", end: "September 17", wind: 90, press: 970, retired: false },
        { name: "Nigel", start: "September 15", end: "September 22", wind: 100, press: 971, retired: false },
        { name: "Ophelia", start: "September 22", end: "September 23", wind: 70, press: 981, retired: false },
        { name: "Philippe", start: "September 23", end: "October 6", wind: 50, press: 998, retired: false },
        { name: "Rina", start: "September 28", end: "October 1", wind: 50, press: 999, retired: false },
        { name: "Sean", start: "October 11", end: "October 16", wind: 45, press: 1004, retired: false },
        { name: "Tammy", start: "October 18", end: "October 29", wind: 110, press: 965, retired: false }
    ],
    "2024": [
        { name: "Alberto", start: "June 19", end: "June 20", wind: 50, press: 992, retired: false },
        { name: "Beryl", start: "June 28", end: "July 9", wind: 165, press: 932, retired: true },
        { name: "Chris", start: "June 30", end: "July 1", wind: 45, press: 1005, retired: false },
        { name: "Debby", start: "Aug 3", end: "Aug 9", wind: 80, press: 979, retired: false },
        { name: "Ernesto", start: "Aug 12", end: "Aug 20", wind: 100, press: 967, retired: false },
        { name: "Francine", start: "Sep 9", end: "Sep 12", wind: 100, press: 972, retired: false },
        { name: "Gordon", start: "Sep 11", end: "Sep 17", wind: 45, press: 1004, retired: false },
        { name: "Helene", start: "Sep 24", end: "Sep 27", wind: 140, press: 938, retired: true },
        { name: "Isaac", start: "Sep 25", end: "Sep 30", wind: 105, press: 963, retired: false },
        { name: "Joyce", start: "Sep 27", end: "Sep 30", wind: 50, press: 1001, retired: false },
        { name: "Kirk", start: "Sep 29", end: "Oct 7", wind: 145, press: 928, retired: false },
        { name: "Leslie", start: "Oct 2", end: "Oct 12", wind: 105, press: 970, retired: false },
        { name: "Milton", start: "Oct 5", end: "Oct 10", wind: 180, press: 895, retired: true },
        { name: "Nadine", start: "Oct 19", end: "Oct 20", wind: 60, press: 1000, retired: false },
        { name: "Oscar", start: "Oct 19", end: "Oct 22", wind: 85, press: 984, retired: false },
        { name: "Patty", start: "Nov 2", end: "Nov 4", wind: 65, press: 982, retired: false },
        { name: "Rafael", start: "Nov 4", end: "Nov 10", wind: 120, press: 954, retired: false },
        { name: "Sara", start: "Nov 14", end: "Nov 18", wind: 50, press: 997, retired: false }
    ],
    "2025": [
        { name: "Andrea", start: "June 23", end: "June 24", wind: 40, press: 1014, retired: false },
        { name: "Barry", start: "June 28", end: "June 30", wind: 45, press: 1006, retired: false },
        { name: "Chantal", start: "July 4", end: "July 7", wind: 60, press: 1002, retired: false },
        { name: "Dexter", start: "Aug 3", end: "Aug 6", wind: 60, press: 999, retired: false },
        { name: "Erin", start: "Aug 11", end: "Aug 22", wind: 160, press: 915, retired: false },
        { name: "Fernand", start: "Aug 23", end: "Aug 27", wind: 60, press: 999, retired: false },
        { name: "Gabrielle", start: "Sep 17", end: "Sep 25", wind: 140, press: 944, retired: false },
        { name: "Humberto", start: "Sep 24", end: "Oct 1", wind: 160, press: 918, retired: false },
        { name: "Imelda", start: "Sep 27", end: "Oct 2", wind: 90, press: 966, retired: false },
        { name: "Jerry", start: "Oct 7", end: "Oct 11", wind: 65, press: 1000, retired: false },
        { name: "Karen", start: "Oct 9", end: "Oct 10", wind: 45, press: 998, retired: false },
        { name: "Lorenzo", start: "Oct 13", end: "Oct 15", wind: 60, press: 1000, retired: false },
        { name: "Melissa", start: "Oct 21", end: "Oct 31", wind: 185, press: 892, retired: false }
    ],
    "2026": [
        { name: "Arthur", start: "TBD", end: "TBD", wind: 0, press: 0, retired: false },
        { name: "Bertha", start: "TBD", end: "TBD", wind: 0, press: 0, retired: false },
        { name: "Cristobal", start: "TBD", end: "TBD", wind: 0, press: 0, retired: false },
        { name: "Dolly", start: "TBD", end: "TBD", wind: 0, press: 0, retired: false },
        { name: "Edouard", start: "TBD", end: "TBD", wind: 0, press: 0, retired: false },
        { name: "Fay", start: "TBD", end: "TBD", wind: 0, press: 0, retired: false },
        { name: "Gonzalo", start: "TBD", end: "TBD", wind: 0, press: 0, retired: false },
        { name: "Hanna", start: "TBD", end: "TBD", wind: 0, press: 0, retired: false },
        { name: "Isaias", start: "TBD", end: "TBD", wind: 0, press: 0, retired: false },
        { name: "Josephine", start: "TBD", end: "TBD", wind: 0, press: 0, retired: false },
        { name: "Kyle", start: "TBD", end: "TBD", wind: 0, press: 0, retired: false },
        { name: "Leah", start: "TBD", end: "TBD", wind: 0, press: 0, retired: false },
        { name: "Marco", start: "TBD", end: "TBD", wind: 0, press: 0, retired: false },
        { name: "Nana", start: "TBD", end: "TBD", wind: 0, press: 0, retired: false },
        { name: "Omar", start: "TBD", end: "TBD", wind: 0, press: 0, retired: false },
        { name: "Paulette", start: "TBD", end: "TBD", wind: 0, press: 0, retired: false },
        { name: "Rene", start: "TBD", end: "TBD", wind: 0, press: 0, retired: false },
        { name: "Sally", start: "TBD", end: "TBD", wind: 0, press: 0, retired: false },
        { name: "Teddy", start: "TBD", end: "TBD", wind: 0, press: 0, retired: false },
        { name: "Vicky", start: "TBD", end: "TBD", wind: 0, press: 0, retired: false },
        { name: "Wilfred", start: "TBD", end: "TBD", wind: 0, press: 0, retired: false }
    ]
};

// Storm Name Database
const stormNamesDB = {
    "2026": {
        "Atlantic": ["Arthur", "Bertha", "Cristobal", "Dolly", "Edouard", "Fay", "Gonzalo", "Hanna", "Isaias", "Josephine", "Kyle", "Leah", "Marco", "Nana", "Omar", "Paulette", "Rene", "Sally", "Teddy", "Vicky", "Wilfred"],
        "EastPacific": ["Amanda", "Boris", "Cristina", "Douglas", "Elida", "Fausto", "Genevieve", "Hernan", "Iselle", "Julio", "Karina", "Lowell", "Marie", "Norbert", "Odalys", "Polo", "Rachel", "Simon", "Trudy", "Vance", "Winnie", "Xavier", "Yolanda", "Zeke"]
    },
    "2027": {
        "Atlantic": ["Ana", "Bill", "Claudette", "Danny", "Elsa", "Fred", "Grace", "Henri", "Imani", "Julian", "Kate", "Larry", "Mindy", "Nicholas", "Odette", "Peter", "Rose", "Sam", "Teresa", "Victor", "Wanda"],
        "EastPacific": ["Andres", "Blanca", "Carlos", "Dolores", "Enrique", "Felicia", "Guillermo", "Hilda", "Ignacio", "Jimena", "Kevin", "Linda", "Marty", "Nora", "Olaf", "Pamela", "Rick", "Sandra", "Terry", "Vivian", "Waldo", "Xina", "York", "Zelda"]
    }
};


// --- Navigation Logic --- 
let navStartIndex = 0;
const NAV_ITEMS_PER_VIEW = 3;

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initStormNames();
    initHistoricalData(); 
    Dates();
    fetchTropicalData(); 
});

function initNavigation() {
    const navContainer = document.querySelector('.navigation');
    if (!navContainer) return;
    navContainer.innerHTML = '';
    renderNav(navContainer);
}

function renderNav(container) {
    container.innerHTML = '';
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    const leftArrow = document.createElement('div');
    leftArrow.className = `nav-arrow ${navStartIndex === 0 ? 'disabled' : ''}`;
    leftArrow.innerHTML = '&lt;';
    leftArrow.onclick = () => { if (navStartIndex > 0) { navStartIndex--; renderNav(container); } };
    container.appendChild(leftArrow);

    const visibleLinks = siteLinks.slice(navStartIndex, navStartIndex + NAV_ITEMS_PER_VIEW);
    
    visibleLinks.forEach(link => {
        const btn = document.createElement('div');
        btn.className = 'btn-nav-header';
        if (link.url === currentPath) btn.classList.add('active');
        btn.textContent = link.name;
        btn.onclick = () => { if (link.url !== '#') window.location.href = link.url; };
        container.appendChild(btn);
    });

    const rightArrow = document.createElement('div');
    const maxIndex = siteLinks.length - NAV_ITEMS_PER_VIEW;
    rightArrow.className = `nav-arrow ${navStartIndex >= maxIndex ? 'disabled' : ''}`;
    rightArrow.innerHTML = '&gt;';
    rightArrow.onclick = () => { if (navStartIndex < maxIndex) { navStartIndex++; renderNav(container); } };
    container.appendChild(rightArrow);
}

// --- Historical Data Logic ---
let barChartInstance = null;
let scatterChartInstance = null;
let lineChartInstance = null;

function initHistoricalData() {
    if (!document.querySelector('.history-container')) return;
    loadSeason('2025'); 
}

function loadSeason(year) {
        // Populate Season Stats (2025 example, others can be filled similarly)
        if (year === "2025") {
            document.getElementById('stat-most-active').textContent = '2 (Humberto & Imelda)';
            document.getElementById('stat-lowest-pressure').textContent = 'Melissa (892 mb)';
            document.getElementById('stat-highest-wind').textContent = 'Melissa (185 mph)';
            document.getElementById('stat-landfalling').textContent = 'Barry, Chantal, Melissa';
            document.getElementById('stat-us-landfalling').textContent = 'Chantal';
            document.getElementById('stat-costliest').textContent = 'Melissa (>$10B USD)';
            document.getElementById('stat-highest-lat').textContent = 'Karen (44.5°N)';
            document.getElementById('stat-lowest-lat').textContent = 'Melissa (Jamaica, ~18°N)';
            document.getElementById('stat-worst-country').textContent = 'Jamaica ($9.5B+ damage)';
            document.getElementById('stat-retired').textContent = 'TBD (1, Melissa likely)';
        } else if (year === "2024") {
            document.getElementById('stat-most-active').textContent = '3 (Milton, Kirk, Leslie)';
            document.getElementById('stat-lowest-pressure').textContent = 'Milton (895 mb)';
            document.getElementById('stat-highest-wind').textContent = 'Milton (180 mph)';
            document.getElementById('stat-landfalling').textContent = 'Alberto, Beryl, Chris, Debby, Ernesto, Francine, Helene, Milton, Nadine, Oscar, Rafael, Sara';
            document.getElementById('stat-us-landfalling').textContent = 'Beryl, Debby, Francine, Helene, Milton';
            document.getElementById('stat-costliest').textContent = 'Milton ($34.4B USD)';
            document.getElementById('stat-highest-lat').textContent = 'Patty (40.6°N)';
            document.getElementById('stat-lowest-lat').textContent = 'Beryl (8.9°N)';
            document.getElementById('stat-worst-country').textContent = 'United States ($120B+ damage)';
            document.getElementById('stat-retired').textContent = '3';
        } else if (year === "2023") {
            document.getElementById('stat-most-active').textContent = '3 (Milton, Kirk, Leslie)';
            document.getElementById('stat-lowest-pressure').textContent = 'Milton (895 mb)';
            document.getElementById('stat-highest-wind').textContent = 'Milton (180 mph)';
            document.getElementById('stat-landfalling').textContent = 'Franklin, Harold, Idalia, Lee, Ophelia';
            document.getElementById('stat-us-landfalling').textContent = 'Harold, Idalia, Ophelia';
            document.getElementById('stat-costliest').textContent = 'Idalia ($3.6B USD)';
            document.getElementById('stat-highest-lat').textContent = 'Nigel (61.5°N)';
            document.getElementById('stat-lowest-lat').textContent = 'Nigel (13.6°N)';
            document.getElementById('stat-worst-country').textContent = 'United States ($4.1+ damage)';
            document.getElementById('stat-retired').textContent = '0';
        } else if (year === "2013") {
            document.getElementById('stat-most-active').textContent = '2 (Humberto, Ingrid)';
            document.getElementById('stat-lowest-pressure').textContent = 'Humberto (979 mb)';
            document.getElementById('stat-highest-wind').textContent = 'Humberto (90 mph)';
            document.getElementById('stat-landfalling').textContent = 'Andrea, Barry, Ingrid';
            document.getElementById('stat-us-landfalling').textContent = 'Andrea';
            document.getElementById('stat-costliest').textContent = 'Ingrid ($1.5b 2013 USD)';
            document.getElementById('stat-highest-lat').textContent = 'Mellissa (41.5°N)';
            document.getElementById('stat-lowest-lat').textContent = 'Chantal (9.3°N)';
            document.getElementById('stat-worst-country').textContent = 'Mexico ($1b+ 2013 USD)';
            document.getElementById('stat-retired').textContent = '1';
        } else if (year === "1996") {
            document.getElementById('stat-most-active').textContent = '3 (Edouard, Fran, Gustav (Remenants) )';
            document.getElementById('stat-lowest-pressure').textContent = 'Edouard (933 mb)';
            document.getElementById('stat-highest-wind').textContent = 'Edouard (145 mph)';
            document.getElementById('stat-landfalling').textContent = 'Bertha, Cesar (Exited Basin,) Dolly, Fran, Hortense, Josephine, Lili, ';
            document.getElementById('stat-us-landfalling').textContent = 'Bertha, Fran, Josephine';
            document.getElementById('stat-costliest').textContent = 'Fran ($5.1b+ 1996 USD)';
            document.getElementById('stat-highest-lat').textContent = 'Josephine (63.0°N)';
            document.getElementById('stat-lowest-lat').textContent = 'Cesar (11.6°N)';
            document.getElementById('stat-worst-country').textContent = 'United States ($5.1b+ 1996 USD)';
            document.getElementById('stat-retired').textContent = '3 ';
        } else if (year === "1995") {
            document.getElementById('stat-most-active').textContent = '3 (Jerry, Iris, Humberto)';
            document.getElementById('stat-lowest-pressure').textContent = 'Opal (916 mb)';
            document.getElementById('stat-highest-wind').textContent = 'Opal (150 mph)';
            document.getElementById('stat-landfalling').textContent = 'Allison, Barry, Dean, Erin, Six, Gabrielle, Jerry, Luis (Ex), Opal, Roxanne';
            document.getElementById('stat-us-landfalling').textContent = 'Allison, Dean, Erin, Jerry, Opal';
            document.getElementById('stat-costliest').textContent = 'Opal ($4.7b 1995 USD)';
            document.getElementById('stat-highest-lat').textContent = 'Allison (65°N)';
            document.getElementById('stat-lowest-lat').textContent = 'Pablo (8.3°N)';
            document.getElementById('stat-worst-country').textContent = 'United States ($2.1b+ 1995 USD)';
            document.getElementById('stat-retired').textContent = '4';
        } else {
            document.getElementById('stat-most-active').textContent = '-';
            document.getElementById('stat-lowest-pressure').textContent = '-';
            document.getElementById('stat-highest-wind').textContent = '-';
            document.getElementById('stat-landfalling').textContent = '-';
            document.getElementById('stat-us-landfalling').textContent = '-';
            document.getElementById('stat-costliest').textContent = '-';
            document.getElementById('stat-highest-lat').textContent = '-';
            document.getElementById('stat-lowest-lat').textContent = '-';
            document.getElementById('stat-worst-country').textContent = '-';
            document.getElementById('stat-retired').textContent = '-';
        }
    const data = historicalDB[year];
    if (!data) return;

    // Update Buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.textContent.includes(year)) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    // Populate Stats
    const hurricanes = data.filter(s => s.wind >= 74);
    const majors = data.filter(s => s.wind >= 111);
    const strongest = data.reduce((prev, current) => (prev.wind > current.wind) ? prev : current);

    document.getElementById('total-storms').textContent = data.length;
    document.getElementById('total-hurricanes').textContent = hurricanes.length;
    document.getElementById('total-major').textContent = majors.length;
    document.getElementById('strongest-storm').textContent = `${strongest.name} (${strongest.wind} mph)`;

    // Populate Table
    const tbody = document.getElementById('storm-table-body');
    tbody.innerHTML = '';
    const greekLetters = {
        "Alpha": "\u03b1", "Beta": "\u03b2", "Gamma": "\u03b3", "Delta": "\u03b4", "Epsilon": "\u03b5", "Zeta": "\u03b6", "Eta": "\u03b7", "Theta": "\u03b8", "Iota": "\u03b9", "Kappa": "\u03bA", "Lambda": "\u03bB", "Mu": "\u03bC", "Nu": "\u03bD", "Xi": "\u03bE", "Omicron": "\u03bF", "Pi": "\u03b0", "Rho": "\u03b1", "Sigma": "\u03b3", "Tau": "\u03b4", "Upsilon": "\u03b5", "Phi": "\u03b6", "Chi": "\u03b7", "Psi": "\u03b8", "Omega": "\u03b9"
    };
    data.forEach(storm => {
        const row = document.createElement('tr');
        const cat = (storm.type && storm.type.toLowerCase().includes('subtropical')) ? 'SS' : getCategory(storm.wind);
        const nameClass = storm.retired ? 'retired-name' : '';
        let nameCell = `<span class="${nameClass}">${storm.name}`;
        if (greekLetters[storm.name]) {
            nameCell += ` <span class="greek-indicator">${greekLetters[storm.name]}</span>`;
        }
        nameCell += '</span>';
        row.innerHTML = `
            <td>${nameCell}</td>
            <td>${storm.start} - ${storm.end}</td>
            <td>${storm.wind} mph</td>
            <td>${storm.press} mb</td>
            <td style="color:${getCategoryColor(cat)}">${cat}</td>
        `;
        tbody.appendChild(row);
    });

    renderCharts(data, year);
}


function getCategory(wind) {
    if (wind < 39) return "TD";
    if (wind < 74) return "TS";
    if (wind < 96) return "Cat 1";
    if (wind < 111) return "Cat 2";
    if (wind < 130) return "Cat 3";
    if (wind < 157) return "Cat 4";
    return "Cat 5";
}

function getCategoryColor(cat) {
    const map = {
        "TD": "#5EBAFF", "TS": "#00FF00", "Cat 1": "#FFFF00", 
        "Cat 2": "#FFA500", "Cat 3": "#FF6347", "Cat 4": "#FF1493", "Cat 5": "#9400D3"
    };
    return map[cat] || "#FFF";
}

// Helper: Calculate days between two date strings (e.g., "June 19", "June 20")
function getDaysActive(startStr, endStr, year) {
    let startDate = new Date(`${startStr}, ${year}`);
    let endDate = new Date(`${endStr}, ${year}`);

    // If the end date is mathematically BEFORE the start date (e.g., Jan 6 < Dec 30)
    // it means the storm crossed into the next year.
    if (endDate < startDate) {
        endDate = new Date(`${endStr}, ${parseInt(year) + 1}`);
    }

    const diffTime = Math.abs(endDate - startDate);
    // Convert milliseconds to days and add 1 to include the first day
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return days;
}

// Helper: Generate a simulated array of winds [Day 1, Day 2, ... Day N]
function generateLifecycle(days, maxWind) {
    const lifecycle = [];
    // Ensure we have at least 1 day to avoid division by zero
    const totalDays = Math.max(1, days);
    const peakIndex = Math.floor(totalDays / 2); 
    
    for (let i = 0; i < totalDays; i++) {
        let currentWind;
        
        if (totalDays === 1) {
            currentWind = maxWind;
        } else if (i === 0 || i === totalDays - 1) {
            // Start and end at standard Tropical Depression/Storm minimums
            currentWind = Math.min(35, maxWind); 
        } else if (i === peakIndex) {
            currentWind = maxWind;
        } else {
            if (i < peakIndex) {
                // Ramping up to peak
                const progress = i / peakIndex;
                currentWind = 35 + (maxWind - 35) * progress;
            } else {
                // Winding down from peak
                const progress = (i - peakIndex) / (totalDays - 1 - peakIndex);
                currentWind = maxWind - (maxWind - 35) * progress;
            }
        }
        
        // Add subtle variation (±3 mph) for a more realistic "jagged" look
        currentWind += (Math.random() * 6 - 3); 
        
        // Clamp values so they don't exceed peak or drop below 30
        currentWind = Math.min(maxWind, Math.max(30, currentWind));
        
        lifecycle.push(Math.round(currentWind));
    }
    return lifecycle;
}


function renderCharts(data, year) {
    const ctxBar = document.getElementById('barChart').getContext('2d');
    const ctxScatter = document.getElementById('scatterChart').getContext('2d');
    const ctxLine = document.getElementById('lineChart').getContext('2d');

    // Destroy old charts
    if (barChartInstance) barChartInstance.destroy();
    if (scatterChartInstance) scatterChartInstance.destroy();
    if (lineChartInstance) lineChartInstance.destroy();

    // 1. Bar Chart (Count by Category)
    const counts = { "TS": 0, "Cat 1": 0, "Cat 2": 0, "Cat 3": 0, "Cat 4": 0, "Cat 5": 0 };
    data.forEach(s => {
        let c = getCategory(s.wind);
        if(c === "TD") return; 
        if(counts[c] !== undefined) counts[c]++;
    });

    barChartInstance = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: Object.keys(counts),
            datasets: [{
                label: '# of Storms',
                data: Object.values(counts),
                backgroundColor: ['#00FF00', '#FFFF00', '#FFA500', '#FF6347', '#FF1493', '#9400D3']
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { color: 'white' } },
                x: { ticks: { color: 'white' } }
            }
        }
    });

    // 2. Scatter Plot (Wind vs Pressure)
    const scatterPoints = data.map(s => ({ x: s.press, y: s.wind }));
    
    scatterChartInstance = new Chart(ctxScatter, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Pressure (x) vs Wind (y)',
                data: scatterPoints,
                backgroundColor: '#656CE5'
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { 
                    title: { display: true, text: 'Pressure (mb)', color: 'white' },
                    ticks: { color: 'white'}, callback: function(value, index, ticks) {return value.toString().replace(/,/g, ''); },
                    reverse: true,
                },
                y: { 
                    title: { display: true, text: 'Wind (mph)', color: 'white' },
                    ticks: { color: 'white' },
                    reverse: true
                }
            },
            plugins: { legend: { labels: { color: 'white' } } }
        }
    });

    // 3. Line Chart (Lifecycle Timeline: Day 1, Day 2...)
    // Generate datasets
    let longestDuration = 0;
    const datasets = data.map((storm, index) => {
        const days = getDaysActive(storm.start, storm.end, year);
        if (days > longestDuration) longestDuration = days;
        
        // Generate daily data
        const windData = generateLifecycle(days, storm.wind);
        
        // Generate a color based on intensity or index
        // Using a distinct color palette
        const hue = (index * 137.508) % 360; // Golden angle approx for distinct colors
        
        return {
            label: storm.name,
            data: windData,
            borderColor: `hsl(${hue}, 80%, 60%)`,
            backgroundColor: 'transparent',
            tension: 0.4,
            borderWidth: 4,
            pointRadius: 2
        };
    });

    // Generate Labels (Day 1, Day 2, etc.)
    const labels = [];
    for(let i=1; i<=longestDuration; i++) {
        labels.push(`Day ${i}`);
    }

    lineChartInstance = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: { 
                    title: { display: true, text: 'Wind Speed (mph)', color: '#ccc' },
                    ticks: { color: 'white' },
                    beginAtZero: false,
                },
                x: { 
                    title: { display: true, text: 'Days Since Formation', color: '#ccc' },
                    ticks: { color: 'white' } 
                }
            },
            plugins: { 
                legend: { 
                    labels: { color: 'white', boxWidth: 10 },
                    position: 'bottom' 
                },
                tooltip: {
                    callbacks: {
                        title: (context) => context[0].label
                    }
                }
            }
        }
    });
}


// --- Existing Logic (Storm Names, Shared, Fetch, SST) ---
// (Kept exactly as before)

function initStormNames() {
    if (!document.getElementById('names-2026')) return; 
    renderNameList('2026', 'Atlantic', 'atl-2026');
    renderNameList('2026', 'EastPacific', 'epac-2026');
    renderNameList('2027', 'Atlantic', 'atl-2027');
    renderNameList('2027', 'EastPacific', 'epac-2027');
}

function renderNameList(year, basin, elementId) {
    const listEl = document.getElementById(elementId);
    if (!listEl) return;
    const names = stormNamesDB[year][basin];
    listEl.innerHTML = '';
    names.forEach(name => {
        const li = document.createElement('li');
        li.className = 'storm-name-item';
        li.dataset.name = name.toLowerCase(); 
        li.textContent = name;
        listEl.appendChild(li);
    });
}

function filterNames(year) {
    const btns = document.querySelectorAll('.filter-btn');
    btns.forEach(b => {
        if(b.textContent.includes(year)) b.classList.add('active');
        else b.classList.remove('active');
    });
    document.getElementById('names-2026').classList.remove('active');
    document.getElementById('names-2027').classList.remove('active');
    document.getElementById(`names-${year}`).classList.add('active');
}

function toggleUnits() {
   isMetric = !isMetric;
   const btn = document.getElementById('unit-toggle');
   if(btn) btn.textContent = isMetric ? 'Imperial' : 'Metric';
   if(document.getElementById('storms-active')) fetchTropicalData();
}

function convertSpeed(mph) { return isMetric ? Math.round(mph * 1.852) : mph; }
function convertPressure(mb) { return isMetric ? mb : Math.round(mb * 0.02953); }
function getSpeedUnit() { return isMetric ? 'km/h' : 'mph'; }
function getPressureUnit() { return isMetric ? 'mb' : 'inHg'; }

function getMovementDirection(bearing) {
   const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
   return directions[Math.round(bearing / 22.5) % 16];
}

function Dates() {
   utcTime = new Date().toLocaleString("en-GB", {timeZone: "UTC", month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false}) + " UTC";
   currentTime = new Date().toLocaleString("en-US", {month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true});
   const utcEl = document.getElementById("utc-tz");
   const localEl = document.getElementById("local-tz");
   if(utcEl) utcEl.textContent = utcTime;
   if(localEl) localEl.textContent = currentTime;

   const now = new Date();
   const welcomeEl = document.getElementById("page-welcome");
   if(welcomeEl && welcomeEl.textContent.includes("Welcome!")) {
       const getOrdinal = (n) => { const s = ["th", "st", "nd", "rd"]; const v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
       welcomeEl.textContent = `Welcome! Today is ${now.toLocaleString("en-US", { month: "long" })} ${getOrdinal(now.getDate())}, ${now.getFullYear()}.`;
   }
}

function filterSST(category) {
    if(!document.querySelector('.sst-grid')) return; 
    const cards = document.querySelectorAll('.sst-card');
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
       if(btn.textContent.toLowerCase().includes(category) || 
         (category === 'hemi' && btn.textContent.includes('Hemispheres')) ||
         (category === 'ocean' && btn.textContent.includes('Ocean'))) {
          btn.classList.add('active');
       } else { btn.classList.remove('active'); }
       if(category === 'all' && btn.textContent === 'All') btn.classList.add('active');
    });
    cards.forEach(card => {
       if (category === 'all' || card.getAttribute('data-category') === category) card.style.display = 'block';
       else card.style.display = 'none';
    });
 }

async function fetchTropicalData() {
   const apiUrl = 'https://api.weather.com/v3/tropical/cone?source=default&basin=all&language=en-US&format=json&units=e&nautical=false&apiKey=8de2d8b3a93542c9a2d8b3a935a2c909';
   try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      const activeNames = [];
      if (data.features && data.features.length > 0) {
         data.features.forEach(f => { if(f.properties.stormName) activeNames.push(f.properties.stormName.toLowerCase()); });
         if(document.getElementById("storms-active")) await displayStorms(data.features);
      } else {
         if(document.getElementById("storms-active")) document.getElementById("storms-active").textContent = "There are no Tropical Cyclones Active.";
      }
      if(document.querySelector('.storm-name-item')) markUsedNames(activeNames);
   } catch (error) {
      if(document.getElementById("storms-active")) document.getElementById("storms-active").textContent = "Error loading storm data.";
   }
}

function markUsedNames(activeNamesList) {
    document.querySelectorAll('.storm-name-item').forEach(item => {
        if (activeNamesList.includes(item.dataset.name)) item.classList.add('used');
    });
}

function getStormColor(stormSubTypeCode, stormType) {
   const colorMap = { 'TD': '#5EBAFF', 'TS': '#00FF00', '1': '#FFFF00', '2': '#FFA500', '3': '#FF6347', '4': '#FF1493', '5': '#9400D3' };
   if (stormType && stormType.toLowerCase().includes('depression')) return colorMap['TD'];
   if (stormType && stormType.toLowerCase().includes('storm') && !stormType.toLowerCase().includes('cyclone')) return colorMap['TS'];
   return colorMap[stormSubTypeCode] || '#0022FF';
}

function getTimeDifference(issueDateTime) {
   const now = new Date();
   const diffMs = now - new Date(issueDateTime);
   if (diffMs < 0) return { isFuture: true, text: "is ahead of schedule!" };
   return { isFuture: false, text: `was ${Math.floor(diffMs / (36e5))} hours and ${Math.floor((diffMs % (36e5)) / 6e4)} minutes ago` };
}

function getNextUpdateTime(issueDateTime) {
   const diffMs = (new Date(issueDateTime).getTime() + 216e5) - new Date();
   if (diffMs <= 0) return "is currently overdue";
   return `should be in ${Math.floor(diffMs / (36e5))} hours and ${Math.floor((diffMs % (36e5)) / 6e4)} minutes`;
}

function formatCoordinates(lat, latHemi, lon, lonHemi) { return `${Math.abs(lat)}°${latHemi}, ${Math.abs(lon)}°${lonHemi}`; }

function getStormImageUrl(stormNumber, currentPosition) {
   const paddedNumber = String(stormNumber).padStart(2, '0');
   let centerLetter = (currentPosition.latitudeHemisphere === 'S') ? 'S' : (currentPosition.longitudeHemisphere === 'W' ? 'L' : (currentPosition.longitudeHemisphere === 'E' ? 'W' : 'S'));
   const now = new Date();
   const possibleTimes = [];
   for (let i = 0; i < 5; i++) {
      let checkHour = Math.floor(now.getUTCHours() / 6) * 6 - (i * 6);
      let checkDay = now.getUTCDate();
      if (checkHour < 0) { checkHour += 24; checkDay -= 1; }
      const dayStr = String(checkDay).padStart(2, '0');
      const hourStr = String(checkHour).padStart(2, '0');
      possibleTimes.push(`https://corsproxy.io/?url=${encodeURIComponent(`https://www.metoc.navy.mil/jtwc/products/${paddedNumber}${centerLetter}_${dayStr}${hourStr}00sair.jpg`)}`);
   }
   return possibleTimes;
}

async function tryLoadImage(urls, stormName) {
   for (const url of urls) {
      try { if ((await fetch(url, { method: 'HEAD' })).ok) return { success: true, url: url }; } catch (e) { }
   }
   return { success: false, message: `The Latest Satellite Image for ${stormName} could not be found.` };
}

async function displayStorms(features) {
   const container = document.body;
   document.querySelectorAll('.tropical-data, .line-seperator:not(:first-of-type)').forEach(el => el.remove());
   
   const activeStorms = features.filter(f => new Date(f.properties.issueDateTime) >= new Date(Date.now() - 648e5));
   
   const statusEl = document.getElementById("storms-active");
   if (activeStorms.length > 0) {
      statusEl.textContent = `There ${activeStorms.length === 1 ? 'is' : 'are'} ${activeStorms.length} Tropical Cyclone${activeStorms.length === 1 ? '' : 's'} Active.`;
   } else {
      statusEl.textContent = "There are no Tropical Cyclones Active.";
      return;
   }
   
   for (const feature of activeStorms) {
      const props = feature.properties;
      const pos = props.currentPosition;
      
      const separator = document.createElement('div');
      separator.className = 'line-seperator';
      container.appendChild(separator);
      
      const stormDiv = document.createElement('div');
      stormDiv.className = 'tropical-data';
      
      const stormName = document.createElement('div');
      stormName.className = 'tropical-name';
      stormName.textContent = `Tropical Cyclone ${props.stormName}:`;
      stormDiv.appendChild(stormName);
      
      const imageResult = await tryLoadImage(getStormImageUrl(props.stormNumber, pos), props.stormName);
      if (imageResult.success) {
         const stormImg = document.createElement('img');
         stormImg.className = 'tropical-image';
         stormImg.src = imageResult.url;
         stormDiv.appendChild(stormImg);
      } else {
         const noImageMsg = document.createElement('div');
         noImageMsg.className = 'tropical-wx-param';
         noImageMsg.style.color = '#FFA500';
         noImageMsg.style.top = '23px';
         noImageMsg.textContent = imageResult.message;
         stormDiv.appendChild(noImageMsg);
      }
      
      const stormStatus = document.createElement('div');
      stormStatus.className = 'tropical-status';
      stormStatus.textContent = pos.stormSubType || pos.stormType;
      stormStatus.style.color = getStormColor(pos.stormSubTypeCode, pos.stormType);
      stormDiv.appendChild(stormStatus);
      
      const windSpeed = document.createElement('div');
      windSpeed.className = 'tropical-wx-param';
      windSpeed.textContent = `Sustained Winds: ${convertSpeed(pos.maximumSustainedWind)} ${getSpeedUnit()}`;
      stormDiv.appendChild(windSpeed);
      stormDiv.appendChild(document.createElement('br'));
      
      const pressure = document.createElement('div');
      pressure.className = 'tropical-wx-param';
      pressure.textContent = pos.minimumPressure ? `Pressure: ${convertPressure(pos.minimumPressure)} ${getPressureUnit()}` : 'Pressure: N/A';
      stormDiv.appendChild(pressure);
      stormDiv.appendChild(document.createElement('br'));
      
      if (pos.movementSpeed && pos.movementDirection) {
         const movement = document.createElement('div');
         movement.className = 'tropical-wx-param';
         movement.textContent = `Movement: ${getMovementDirection(pos.movementDirection)} at ${convertSpeed(pos.movementSpeed)} ${getSpeedUnit()}`;
         stormDiv.appendChild(movement);
         stormDiv.appendChild(document.createElement('br'));
      }
      
      const coordinates = document.createElement('div');
      coordinates.className = 'tropical-wx-param';
      coordinates.textContent = `Location: ${formatCoordinates(pos.latitude, pos.latitudeHemisphere, pos.longitude, pos.longitudeHemisphere)}`;
      stormDiv.appendChild(coordinates);
      stormDiv.appendChild(document.createElement('br'));
      stormDiv.appendChild(document.createElement('br'));
      
      const summary = document.createElement('div');
      summary.className = 'tropical-wx-summary';
      const issueTime = new Date(props.issueDateTime).toLocaleString('en-US', {hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC'});
      summary.innerHTML = `This information was last updated at ${issueTime} UTC, which ${getTimeDifference(props.issueDateTime).text}.<br><br>The next update ${getNextUpdateTime(props.issueDateTime)}.`;
      stormDiv.appendChild(summary);
      
      container.appendChild(stormDiv);
   }
}

setInterval(() => { Dates(); fetchTropicalData(); }, 300000);