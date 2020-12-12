$(document).ready(function() {



    const apiRoot = 'https://mighty-citadel-78297.herokuapp.com/v1/task/';
    const trelloApiRoot = 'http://localhost:8080/v1/trello/';
    const datatableRowTemplate = $('[data-datatable-row-template]').children()[0];
    const tasksContainer = $('[data-tasks-container]');

    const availableBoards = {};
    const availableTasks = {};

    // init
    getAllTasks();

    function getAllAvailableBoards(callback, callbackArgs) {
        const requestUrl = trelloApiRoot + 'getTrelloBoards';

        $.ajax({
            url: requestUrl,
            method: 'GET',
            contentType: 'application/json',
            success: function(boards) { callback(callbackArgs, boards); }
        });
    }

    function createElement(data) {
        const element = $(datatableRowTemplate).clone();

        element.attr('data-task-id', data.id);
        element.find('[data-task-name-section] [data-task-name-paragraph]').text(data.title);
        element.find('[data-task-name-section] [data-task-name-input]').val(data.title);

        element.find('[data-task-content-section] [data-task-content-paragraph]').text(data.content);
        element.find('[data-task-content-section] [data-task-content-input]').val(data.content);

        return element;
    }

    function prepareBoardOrListSelectOptions(availableChoices) {
        return availableChoices.map(function(choice) {
            return $('<option>')
                .addClass('crud-select__option')
                .val(choice.id)
                .text(choice.name || 'Unknown name');
        });
    }

    function handleDatatableRender(taskData, boards) {
        $tasksContainer.empty();
        boards.forEach(board => {
            availableBoards[board.id] = board;
        });

        taskData.forEach(function(task) {
            const $datatableRowEl = createElement(task);
            const $availableBoardsOptionElements = prepareBoardOrListSelectOptions(boards);

            $datatableRowEl.find('[data-board-name-select]')
                .append($availableBoardsOptionElements);

            $datatableRowEl
                .appendTo($tasksContainer);
        });
    }

    function getAllTasks() {
        const requestUrl = apiRoot + 'getTasks';

        $.ajax({
            url: requestUrl,
            method: 'GET',
            contentType: "application/json",
            success: function (tasks) {
                tasks.forEach(task => {
                    availableTasks[task.id] = task;
                });

                getAllAvailableBoards(handleDatatableRender, tasks);
            }
        });
    }

    function handleTaskUpdateRequest() {
        const parentEl = $(this).parent().parent();
        const taskId = parentEl.attr('data-task-id');
        const taskTitle = parentEl.find('[data-task-name-input]').val();
        const taskContent = parentEl.find('[data-task-content-input]').val();
        const requestUrl = apiRoot + 'updateTask';

        $.ajax({
            url: requestUrl,
            method: "PUT",
            processData: false,
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            data: JSON.stringify({
                id: taskId,
                title: taskTitle,
                content: taskContent
            }),
            success: function(data) {
                parentEl.attr('data-task-id', data.id).toggleClass('datatable__row--editing');
                parentEl.find('[data-task-name-paragraph]').text(taskTitle);
                parentEl.find('[data-task-content-paragraph]').text(taskContent);
            }
        });
    }

    function handleTaskDeleteRequest() {
        const parentEl = $(this).parent().parent();
        const taskId = parentEl.attr('data-task-id');
        const requestUrl = apiRoot + 'deleteTask' + '/' + taskId;

        $.ajax({
            url: requestUrl,
            method: 'DELETE',
            success: function() {
                parentEl.slideUp(400, function() { parentEl.remove(); });
            }
        })
    }

    function handleTaskSubmitRequest(event) {
        event.preventDefault();

        const taskTitle = $(this).find('[name="title"]').val();
        const taskContent = $(this).find('[name="content"]').val();

        const requestUrl = apiRoot + 'createTask';

        $.ajax({
            url: requestUrl,
            method: 'POST',
            processData: false,
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            data: JSON.stringify({
                title: taskTitle,
                content: taskContent
            }),
            complete: function(data) {
                if(data.status === 200) {
                    getAllTasks();
                }
            }
        });
    }

    function toggleEditingState() {
        const parentEl = $(this).parent().parent();
        parentEl.toggleClass('datatable__row--editing');

        const taskTitle = parentEl.find('[data-task-name-paragraph]').text();
        const taskContent = parentEl.find('[data-task-content-paragraph]').text();

        parentEl.find('[data-task-name-input]').val(taskTitle);
        parentEl.find('[data-task-content-input]').val(taskContent);
    }

    $('[data-task-add-form]').on('submit', handleTaskSubmitRequest);

    tasksContainer.on('click','[data-task-edit-button]', toggleEditingState);
    tasksContainer.on('click','[data-task-edit-abort-button]', toggleEditingState);
    tasksContainer.on('click','[data-task-submit-update-button]', handleTaskUpdateRequest);
    tasksContainer.on('click','[data-task-delete-button]', handleTaskDeleteRequest);
});