const {DateTime} = require("luxon");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// On crée un schéma de cette manière ; 
// Le schema est la structure que doit respecter toute entrée/tout document
// d'une collection

const AuthorSchema = new Schema({
    first_name: { type: String, required: true, maxLength: 100 },
    family_name: { type: String, required: true, maxLength: 100 },
    date_of_birth: { type: Date },
    date_of_death: { type: Date },
});

// Creating two virtual fields : name and url

AuthorSchema.virtual("name").get( 
    function() {
        return (this.first_name && this.family_name) ? 
            `${this.family_name}, ${this.first_name}` :
            "";
    }
);

AuthorSchema.virtual("url").get(
    function() {
        return `/catalog/author/${this._id}`
    }
);

AuthorSchema.virtual("formatted_birth").get(
    function() {
        if (!(this.date_of_birth instanceof Date)) return this.date_of_birth;

        return DateTime
            .fromJSDate(this.date_of_birth)
            .toLocaleString(DateTime.DATE_MED);
    }
);

AuthorSchema.virtual("formatted_death").get(
    function() {
        if (!(this.date_of_death instanceof Date)) return this.date_of_death;

        return DateTime
            .fromJSDate(this.date_of_death)
            .toLocaleString(DateTime.DATE_MED);
    }
);

// Une fois le schéma créé, on crée son "Modèle" : on le rentre comme
// collection de notre bdd, sous le nom que l'on veut (ici Author).

module.exports = mongoose.model("Author", AuthorSchema);
