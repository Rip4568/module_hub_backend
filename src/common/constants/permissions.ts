export const Permissions = {
    // E-commerce
    CREATE_PRODUCT: 'can_create_product',
    READ_PRODUCT: 'can_read_product',
    UPDATE_PRODUCT: 'can_update_product',
    DELETE_PRODUCT: 'can_delete_product',
    PUBLISH_PRODUCT: 'can_publish_product',

    CREATE_CATEGORY: 'can_create_category',
    READ_CATEGORY: 'can_read_category',
    UPDATE_CATEGORY: 'can_update_category',
    DELETE_CATEGORY: 'can_delete_category',

    // Orders
    CREATE_ORDER: 'can_create_order',
    READ_ORDER: 'can_read_order',
    UPDATE_ORDER: 'can_update_order',
    CANCEL_ORDER: 'can_cancel_order',
    APPROVE_ORDER: 'can_approve_order',
    ASSIGN_DRIVER: 'can_assign_driver',
    COMPLETE_ORDER: 'can_complete_order',

    // Customers
    CREATE_CUSTOMER: 'can_create_customer',
    READ_CUSTOMER: 'can_read_customer',
    UPDATE_CUSTOMER: 'can_update_customer',
    DELETE_CUSTOMER: 'can_delete_customer',

    // Inventory
    TRANSFER_INVENTORY: 'can_transfer_inventory',
    ADJUST_INVENTORY: 'can_adjust_inventory',
    READ_INVENTORY: 'can_read_inventory',

    // Delivery
    CREATE_DELIVERY: 'can_create_delivery',
    READ_DELIVERY: 'can_read_delivery',
    UPDATE_DELIVERY: 'can_update_delivery',
    COMPLETE_DELIVERY: 'can_complete_delivery',

    // Suppliers
    CREATE_SUPPLIER: 'can_create_supplier',
    READ_SUPPLIER: 'can_read_supplier',
    UPDATE_SUPPLIER: 'can_update_supplier',
    DELETE_SUPPLIER: 'can_delete_supplier',
    APPROVE_SUPPLIER: 'can_approve_supplier',
    BLOCK_SUPPLIER: 'can_block_supplier',

    // Fleet
    CREATE_VEHICLE: 'can_create_vehicle',
    READ_VEHICLE: 'can_read_vehicle',
    UPDATE_VEHICLE: 'can_update_vehicle',
    DELETE_VEHICLE: 'can_delete_vehicle',
    APPROVE_VEHICLE: 'can_approve_vehicle',
    SET_MAINTENANCE: 'can_set_maintenance',

    // Drivers
    CREATE_DRIVER: 'can_create_driver',
    READ_DRIVER: 'can_read_driver',
    UPDATE_DRIVER: 'can_update_driver',
    DELETE_DRIVER: 'can_delete_driver',
    APPROVE_DRIVER: 'can_approve_driver',
    BLOCK_DRIVER: 'can_block_driver',

    // Financial
    READ_FINANCIAL: 'can_read_financial',
    CREATE_PAYMENT: 'can_create_payment',
    APPROVE_PAYMENT: 'can_approve_payment',
    CANCEL_PAYMENT: 'can_cancel_payment',
    VIEW_BALANCE: 'can_view_balance',
    EXPORT_FINANCIAL: 'can_export_financial',

    // Users & Teams
    CREATE_USER: 'can_create_user',
    READ_USER: 'can_read_user',
    UPDATE_USER: 'can_update_user',
    DELETE_USER: 'can_delete_user',
    MANAGE_ROLES: 'can_manage_roles',
    MANAGE_PERMISSIONS: 'can_manage_permissions',

    // Reports
    READ_REPORT: 'can_read_report',
    EXPORT_REPORT: 'can_export_report',
    CREATE_CUSTOM_REPORT: 'can_create_custom_report',
    SCHEDULE_REPORT: 'can_schedule_report',

    // Documents
    CREATE_DOCUMENT: 'can_create_document',
    READ_DOCUMENT: 'can_read_document',
    DELETE_DOCUMENT: 'can_delete_document',

    // Activity Log
    READ_ACTIVITY_LOG: 'can_read_activity_log',

    // Tenant
    CREATE_TENANT: 'can_create_tenant',
    READ_TENANT: 'can_read_tenant',
    UPDATE_TENANT: 'can_update_tenant',
} as const;

export type PermissionType = typeof Permissions[keyof typeof Permissions];
