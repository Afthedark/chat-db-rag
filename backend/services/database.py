"""
Database module for MySQL connection and operations.
Handles connection management, schema extraction, and query execution.
"""

from langchain_community.utilities import sql_database
from business_context import EXCLUDED_TABLES


class DatabaseManager:
    """Manages MySQL database connections and operations."""
    
    def __init__(self):
        self._db = None
        self._cached_schema = None
        self._connection_info = None
    
    def connect(self, user: str, password: str, host: str, port: str, database: str) -> sql_database.SQLDatabase:
        """
        Connect to MySQL database.
        
        Args:
            user: Database username
            password: Database password
            host: Database host
            port: Database port
            database: Database name
            
        Returns:
            SQLDatabase instance
            
        Raises:
            Exception: If connection fails
        """
        db_uri = f"mysql+mysqlconnector://{user}:{password}@{host}:{port}/{database}"
        self._db = sql_database.SQLDatabase.from_uri(db_uri)
        self._cached_schema = None  # Reset cache on new connection
        self._connection_info = {
            'user': user,
            'host': host,
            'port': port,
            'database': database
        }
        return self._db
    
    def test_connection(self, user: str, password: str, host: str, port: str, database: str) -> bool:
        """
        Test database connection without storing it.
        
        Args:
            user: Database username
            password: Database password
            host: Database host
            port: Database port
            database: Database name
            
        Returns:
            True if connection successful, False otherwise
        """
        try:
            db_uri = f"mysql+mysqlconnector://{user}:{password}@{host}:{port}/{database}"
            test_db = sql_database.SQLDatabase.from_uri(db_uri)
            # Try to get table info to verify connection works
            test_db.get_table_info()
            return True
        except Exception:
            return False
    
    def get_schema(self, use_cache: bool = True) -> str:
        """
        Get database schema, with optional caching.
        Returns only business-relevant tables (excludes SIAT/fiscal noise tables).

        Args:
            use_cache: Whether to use cached schema if available

        Returns:
            Database schema as string

        Raises:
            ValueError: If no database connection exists
        """
        if self._db is None:
            raise ValueError("No database connection. Call connect() first.")

        if use_cache and self._cached_schema is not None:
            return self._cached_schema

        # Get all usable tables then filter out excluded ones
        all_tables = self._db.get_usable_table_names()
        relevant_tables = [t for t in all_tables if t not in EXCLUDED_TABLES]
        print(f"[Database] Schema: {len(all_tables)} total tables → {len(relevant_tables)} relevant tables sent to LLM")

        self._cached_schema = self._db.get_table_info(table_names=relevant_tables)
        return self._cached_schema
    
    def clear_schema_cache(self):
        """Clear the cached schema."""
        self._cached_schema = None
    
    def execute_query(self, sql: str) -> str:
        """
        Execute a SQL query and return results.
        
        Args:
            sql: SQL query to execute
            
        Returns:
            Query results as string
            
        Raises:
            ValueError: If no database connection exists
            Exception: If query execution fails
        """
        if self._db is None:
            raise ValueError("No database connection. Call connect() first.")
        
        return self._db.run(sql)
    
    @property
    def is_connected(self) -> bool:
        """Check if database connection exists."""
        return self._db is not None
    
    @property
    def db(self) -> sql_database.SQLDatabase:
        """Get the database instance."""
        if self._db is None:
            raise ValueError("No database connection. Call connect() first.")
        return self._db
    
    @property
    def connection_info(self) -> dict:
        """Get connection info (without password)."""
        return self._connection_info


# Singleton instance for application use
db_manager = DatabaseManager()


# Convenience functions for backward compatibility
def init_database(user: str, password: str, host: str, port: str, database: str) -> sql_database.SQLDatabase:
    """Initialize database connection (backward compatibility)."""
    return db_manager.connect(user, password, host, port, database)


def get_cached_schema() -> str:
    """Get cached schema (backward compatibility)."""
    return db_manager.get_schema(use_cache=True)


def execute_query(sql: str) -> str:
    """Execute SQL query (backward compatibility)."""
    return db_manager.execute_query(sql)
