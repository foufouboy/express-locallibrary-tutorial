const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Display list of all BookInstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
    const allBookInstances = await 
        BookInstance.find().populate("book").exec();

    res.render("bookinstance_list", {
        title: "Book Instance List",
        bookinstance_list: allBookInstances,
    });
});

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id)
    .populate("book")
    .exec();

  if (bookInstance === null) {
    // No results.
    const err = new Error("Book copy not found");
    err.status = 404;
    return next(err);
  }

  res.render("bookinstance_detail", {
    title: "Book:",
    bookinstance: bookInstance,
  });
});

// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
    const allBooks = await Book.find({}, "title").sort({ title: 1}).exec();

    res.render("bookinstance_form", {
        title: "Create BookInstance",
        book_list: allBooks,
    });
});

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    body("book", "Book must be specified")
        .trim()
        .isLength({ min: 1})
        .escape(),
    body("imprint", "Imprint must be specified")
        .trim()
        .isLength({min: 1})
        .escape(),
    body("status").escape(),
    body("due_back", "Invalid date")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);
        const bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
        });

        if (!errors.isEmpty()) {
            const allBooks = await Book.find({}, "title").sort({title: 1}).exec();

            res.render("bookinstance_form", {
                title: "Create BookInstance",
                book_list: allBooks,
                selected_book: bookInstance.book._id,
                errors: errors.array(),
                bookinstance: bookInstance,
            });

            return;
        } else {
            await bookInstance.save();
            res.redirect(bookInstance.url);
        }
    })
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
    // 1. L'instance de livre n'ayant pas de dépendance, il n'y a pas de
    // vérification à faire avant de la supprimer. Nous pouvons rediriger 
    // directement vers une page générique.

    const bookInstance = await BookInstance.findById(req.params.id).exec();

    if (bookInstance === null) {
        res.redirect("/catalog/book/" + bookInstance.book);
    }

    res.render("bookinstance_delete", {
        title: "Delete book instance",
        book_instance: bookInstance,
    });
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
    // On vérifie encore que l'instance existe bien, puis on supprime.

    const bookInstance = await BookInstance.findById(req.params.id).exec();

    if (!bookInstance) {
        res.redirect("/catalog/book/" + bookInstance.book);
    } else {
        await BookInstance.findByIdAndDelete(req.body.bookinstanceid).exec();
        res.redirect("/catalog/book/" + bookInstance.book);
    }
});

// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
    const [bookInstance, allBooks] = await Promise.all([
        BookInstance.findById(req.params.id),
        await Book.find({}, "title").sort({ title: 1}).exec(),
    ]);

    if (bookInstance === null) {
        const err = new Error("The book instance was not found!");
        err.status = 404;
        next(err);
    } else {
        res.render("bookinstance_form", {
            title: "Update book instance",
            book_list: allBooks,
            bookinstance: bookInstance,
            selected_book: bookInstance.book._id
        });
    }
});

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    // Validation and sanitization for update
    // (same as create)
    body("book", "Book must be specified")
        .trim()
        .isLength({ min: 1})
        .escape(),
    body("imprint", "Imprint must be specified")
        .trim()
        .isLength({min: 1})
        .escape(),
    body("status").escape(),
    body("due_back", "Invalid date")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),

    async (req, res, next) => {
        const errors = validationResult(req); 
        const [bookInstance, allBooks] = await Promise.all([
            BookInstance.findById(req.params.id),
            await Book.find({}, "title").sort({ title: 1}).exec(),
        ]);
        const newBookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            due_back: req.body.due_back,
            status: req.body.status,
            _id: req.params.id,
        });

        if (!errors.isEmpty()) {
            res.render("bookinstance_form", {
                title: "Update book instance",
                book_list: allBooks,
                bookinstance: bookInstance,
                selected_book: bookInstance.book._id,
                errors: errors.array(),
            });
        } else if (!bookInstance) {
            const err = new Error("Book instance was not found!");
            err.status = 404;
            next(err);
        } else {
            const updatedBookInstance = await BookInstance
                .findByIdAndUpdate(req.params.id, newBookInstance, {});
            res.redirect(updatedBookInstance.url);
        }
    }
    
]
